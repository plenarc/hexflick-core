// Selection-resolution engine (compute / buildCells / createState). Pure.
// Ported from docs/hexflick-prototype.html.
import { DIRS, type Dir, pos } from "./geometry";
import {
    echar,
    elabel,
    HINT,
    isShift,
    layerOf,
    subOf,
    type Entry,
    type Row,
    type ShiftType,
} from "./layout";

export interface Config {
    th: number;
    cancel: number;
    hr?: number;
}

// Provisional tuning values carried over from the prototype; expect to be
// overridden once real-device testing settles on final numbers.
export const DEFAULT_CONFIG: Config = { th: 26, cancel: 48 };

// One stroke = one State.
export interface State {
    row: Row;
    cx: number;
    cy: number;
    shift: ShiftType | null;
    shiftDir: Dir | null;
    rootDir: Dir | null;
    visited: Set<string>;
    lastSel: string | null;
}

export function createState(row: Row, cx: number, cy: number): State {
    return {
        row,
        cx,
        cy,
        shift: null,
        shiftDir: null,
        rootDir: null,
        visited: new Set(),
        lastSel: null,
    };
}

export interface Cell {
    key: string;
    x: number;
    y: number;
    ch: string;
    lab: string;
    kind: "center" | "base" | "shift" | "sub";
    dir?: Dir;
    shiftType?: ShiftType;
}

// Internal working shape: carries the source Entry (for sub-tree lookups)
// and parent key (for bloom traversal), neither of which is part of the
// public Cell contract.
interface WorkingCell extends Cell {
    entry?: Entry;
    parent?: string;
}

function curRoot(st: State): string {
    const layer = layerOf(st);
    if (st.rootDir) {
        const e = layer[st.rootDir];
        if (e && !isShift(e)) return echar(e);
    }
    return layer.c;
}

// Rules:
//  - every cell has an absolute position on the hex grid; the cell nearest
//    the finger is selected
//  - sub (youon / gairaion) cells only appear/select once their parent
//    cell has actually been visited
//  - the shift hexes (center's u/d) are permanent; landing on one toggles
//    the layer (re-shift), and that instant's selection is "current root
//    char after the shift" (e.g. shi -> ji)
//  - moving CANCEL px+ away from the selected cell (= not over any cell)
//    means releasing commits nothing
function buildCells(st: State): WorkingCell[] {
    const layer = layerOf(st);
    const base = st.row.base;
    const cells: WorkingCell[] = [];

    cells.push({
        key: "c",
        ch: layer.c,
        lab: layer.lab || layer.c,
        x: st.cx,
        y: st.cy,
        kind: "center",
    });

    for (const dir of DIRS) {
        const e = layer[dir];
        if (e && !isShift(e)) {
            const p = pos(st.cx, st.cy, dir);
            cells.push({
                key: dir,
                ch: echar(e),
                lab: elabel(e),
                x: p.x,
                y: p.y,
                kind: "base",
                dir,
                entry: e,
            });
        }
    }

    // Shift hexes (permanent toggle). Label is a hint mark; compute()
    // swaps in the resolved character only while the finger is on it.
    for (const dir of ["u", "d"] as const) {
        const e = base[dir];
        if (isShift(e)) {
            const p = pos(st.cx, st.cy, dir);
            cells.push({
                key: "sh:" + dir,
                x: p.x,
                y: p.y,
                kind: "shift",
                dir,
                shiftType: e.shift,
                ch: HINT[e.shift],
                lab: HINT[e.shift],
            });
        }
    }

    // Bloom: the root's sub-tree. Only children of already-visited nodes
    // are expanded.
    if (st.rootDir) {
        const root = cells.find((c) => c.key === st.rootDir);
        if (root && subOf(root.entry)) {
            const stack: WorkingCell[] = [root];
            while (stack.length) {
                const parent = stack.pop()!;
                const sm = subOf(parent.entry);
                if (!sm || !st.visited.has(parent.key)) continue;
                for (const sd of Object.keys(sm) as Dir[]) {
                    const e = sm[sd]!;
                    // Sub entries are never shift triggers by construction.
                    if (isShift(e)) continue;
                    const p = pos(parent.x, parent.y, sd);
                    const key = parent.key + "." + sd;
                    const c: WorkingCell = {
                        key,
                        ch: echar(e),
                        lab: elabel(e),
                        x: p.x,
                        y: p.y,
                        kind: "sub",
                        entry: e,
                        parent: parent.key,
                    };
                    cells.push(c);
                    stack.push(c);
                }
            }
        }
    }

    // Same-coordinate collisions favor the bloom (e.g. fuo lands on the
    // shift hex's position).
    const seen: Record<string, number> = {};
    const out: WorkingCell[] = [];
    for (const c of cells) {
        const k = Math.round(c.x) + "," + Math.round(c.y);
        if (seen[k] != null) {
            if (c.kind !== "shift" && c.kind !== "center") out[seen[k]] = c;
            continue;
        }
        seen[k] = out.length;
        out.push(c);
    }
    return out;
}

export interface ComputeResult {
    char: string;
    cells: Cell[];
    selCell: Cell;
    cancel: boolean;
}

export function compute(
    state: State,
    x: number,
    y: number,
    cfg: Config = DEFAULT_CONFIG,
): ComputeResult {
    let cells = buildCells(state);

    // Center dead zone.
    if (Math.hypot(x - state.cx, y - state.cy) < cfg.th) {
        const c = cells.find((c) => c.kind === "center");
        if (c) {
            state.lastSel = c.key;
            return { char: c.ch, cells, selCell: c, cancel: false };
        }
    }

    // Nearest cell.
    let best: WorkingCell | null = null;
    let bd = Infinity;
    for (const c of cells) {
        const d = Math.hypot(x - c.x, y - c.y);
        if (d < bd) {
            bd = d;
            best = c;
        }
    }
    if (!best) throw new Error("buildCells() must return at least the center cell");

    if (best.kind === "shift") {
        // Toggle: landing on the hex newly flips base<->shift; staying on
        // it does not re-toggle (edge-detected via lastSel).
        if (state.lastSel !== best.key) {
            state.shift = state.shift === best.shiftType ? null : (best.shiftType ?? null);
            state.shiftDir = state.shift ? (best.dir ?? null) : null;
            cells = buildCells(state);
            best = cells.find((c) => c.key === best!.key) || best;
        }
        best.ch = curRoot(state);
        best.lab = best.ch; // While held, show/commit the resolved char (ji / shi).
        state.lastSel = best.key;
        return { char: best.ch, cells, selCell: best, cancel: bd > cfg.cancel };
    }

    // Regular cell: record visit and update root.
    state.visited.add(best.key);
    if (best.kind === "base") state.rootDir = subOf(best.entry) ? (best.key as Dir) : null;
    if (best.kind === "center") state.rootDir = null;
    // Re-expand: visiting may reveal a new bloom.
    cells = buildCells(state);
    best = cells.find((c) => c.key === best!.key) || best;
    state.lastSel = best.key;
    return { char: best.ch, cells, selCell: best, cancel: bd > cfg.cancel };
}
