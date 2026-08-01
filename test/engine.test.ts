import { describe, expect, it } from "vitest";
import type { Dir } from "../src/geometry";
import { pos } from "../src/geometry";
import { ROWS, type RowKey } from "../src/layout";
import { compute, createState, DEFAULT_CONFIG, type Config } from "../src/engine";

// Test-only helpers matching spec §5: each case is driven as "row -> a
// sequence of waypoint keys", interpolated in ~8 steps per leg like a real
// finger drag, checking the final char/cancel. A "key" is the same address
// scheme buildCells() uses internally: "c" for center, "sh:<dir>" for a
// shift hex, and a dot-separated Dir path (e.g. "ul.dl") for a base cell
// or one of its nested sub cells. Its absolute position is always
// center + the sum of OFF[dir] along that path, regardless of which
// character ends up occupying the slot at drive time.
function keyPos(key: string): { x: number; y: number } {
    if (key === "c") return { x: 0, y: 0 };
    const dirPath = (key.startsWith("sh:") ? [key.slice(3)] : key.split(".")) as Dir[];
    let p = { x: 0, y: 0 };
    for (const dir of dirPath) p = pos(p.x, p.y, dir);
    return p;
}

function interpolate(
    a: { x: number; y: number },
    b: { x: number; y: number },
    steps: number,
): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return pts;
}

function drive(rowKey: RowKey, keys: string[], cfg: Config = DEFAULT_CONFIG, steps = 8) {
    const state = createState(ROWS[rowKey], 0, 0);
    let result = compute(state, 0, 0, cfg); // initial tap (finger down at center)
    let current = { x: 0, y: 0 };
    for (const key of keys) {
        const target = keyPos(key);
        for (const p of interpolate(current, target, steps)) {
            result = compute(state, p.x, p.y, cfg);
        }
        current = target;
    }
    return result;
}

describe("shift hex toggle (sa row)", () => {
    it("さ>し stays base until the shift hex is actually hit", () => {
        expect(drive("sa", ["ul"]).char).toBe("し");
    });
    it("さ>し>右上(HEX) resolves to じ", () => {
        expect(drive("sa", ["ul", "sh:u"]).char).toBe("じ");
    });
    it("さ>し>右上>左下(じの位置)", () => {
        expect(drive("sa", ["ul", "sh:u", "ul"]).char).toBe("じ");
    });
    it("さ>し>右上(じ)>右上もう一度 toggles back to し", () => {
        expect(drive("sa", ["ul", "sh:u", "ul", "sh:u"]).char).toBe("し");
    });
    it("さ>し>右上>左上 reaches じょ", () => {
        expect(drive("sa", ["ul", "sh:u", "ul.u"]).char).toBe("じょ");
    });
});

describe("visit gating (sa row)", () => {
    it("さ>上>左下(じの位置)", () => {
        expect(drive("sa", ["sh:u", "ul"]).char).toBe("じ");
    });
    it("さ>上>左上 aims at an unvisited sub cell and cancels", () => {
        const r = drive("sa", ["sh:u", "ul.u"]);
        expect(r.cancel).toBe(true);
    });
    it("さ>し>しゃ(左下)", () => {
        expect(drive("sa", ["ul", "ul.dl"]).char).toBe("しゃ");
    });
    it("さ>し>しゅ(左上)", () => {
        expect(drive("sa", ["ul", "ul.ul"]).char).toBe("しゅ");
    });
    it("さ>し>しょ(上)", () => {
        expect(drive("sa", ["ul", "ul.u"]).char).toBe("しょ");
    });
    it("さ>上>じ>じゃ", () => {
        expect(drive("sa", ["sh:u", "ul", "ul.dl"]).char).toBe("じゃ");
    });
});

describe("mid-gesture re-shift (sa row)", () => {
    it("し>しゃ>し(通過)>右上HEX", () => {
        expect(drive("sa", ["ul", "ul.dl", "ul", "sh:u"]).char).toBe("じ");
    });
    it("し>しゃ>し>右上HEX>左下", () => {
        expect(drive("sa", ["ul", "ul.dl", "ul", "sh:u", "ul.dl"]).char).toBe("じゃ");
    });
});

describe("daku / handaku / small and reverting", () => {
    it("か>上>中心", () => {
        expect(drive("ka", ["sh:u", "c"]).char).toBe("が");
    });
    it("か>上>中心>上(戻し)", () => {
        expect(drive("ka", ["sh:u", "c", "sh:u"]).char).toBe("か");
    });
    it("は>下>中心", () => {
        expect(drive("ha", ["sh:d", "c"]).char).toBe("ぱ");
    });
    it("あ>上>中心", () => {
        expect(drive("a", ["sh:u", "c"]).char).toBe("ぁ");
    });
    it("あ>下>中心", () => {
        expect(drive("a", ["sh:d", "c"]).char).toBe("ぁ");
    });
    it("は>ふ>ふぇ>中心(戻り)", () => {
        expect(drive("ha", ["dl", "dl.d", "c"]).char).toBe("は");
    });
    it("は>ふ>ふぉ(=下HEX位置と同座標)", () => {
        expect(drive("ha", ["dl", "dl.dr"]).char).toBe("ふぉ");
    });
    it("か>く>ぐ(=下HEX位置と同座標。誤ってが[濁点トグル]にならない)", () => {
        expect(drive("ka", ["dl", "dl.dr"]).char).toBe("ぐ");
    });
    it("さ>す>ず(=下HEX位置と同座標。誤ってざ[濁点トグル]にならない)", () => {
        expect(drive("sa", ["dl", "dl.dr"]).char).toBe("ず");
    });
    it("う訪問後もdシフト(小)がうぉに奪われず機能する", () => {
        expect(drive("a", ["dl", "sh:d", "c"]).char).toBe("ぁ");
    });
    it("か>く: dr未選択の間は濁点ヒント(゛)のまま、ぐを先出ししない", () => {
        const r = drive("ka", ["dl"]);
        const sub = r.cells.find((c) => c.key === "dl.dr");
        expect(sub?.lab).toBe("゛");
        expect(sub?.ch).toBe("ぐ");
    });
    it("か>く>ぐ: 選択した瞬間はシフトHEXと同じく表示もぐになる", () => {
        expect(drive("ka", ["dl", "dl.dr"]).selCell.lab).toBe("ぐ");
    });
    it("さ>す: dr未選択の間は濁点ヒント(゛)のまま、ずを先出ししない", () => {
        const r = drive("sa", ["dl"]);
        const sub = r.cells.find((c) => c.key === "dl.dr");
        expect(sub?.lab).toBe("゛");
        expect(sub?.ch).toBe("ず");
    });
    it("さ>す>ず: 選択した瞬間はシフトHEXと同じく表示もずになる", () => {
        expect(drive("sa", ["dl", "dl.dr"]).selCell.lab).toBe("ず");
    });
});

describe("gairaion / nesting", () => {
    it("う訪問時点でうぇと同時にうぉも現れる(うぇを経由する必要はない)", () => {
        const r = drive("a", ["dl"]);
        expect(r.cells.some((c) => c.key === "dl.d.dr" && c.ch === "うぉ")).toBe(true);
    });
    it("う>うぉ", () => {
        expect(drive("a", ["dl", "dl.d", "dl.d.dr"]).char).toBe("うぉ");
    });
    it("う>うぉ>下", () => {
        expect(drive("a", ["dl", "dl.d", "dl.d.dr", "dl.d.dr.d"]).char).toBe("ヴォ");
    });
    it("う>うぃ>下", () => {
        expect(drive("a", ["dl", "dl.dl", "dl.dl.d"]).char).toBe("ヴィ");
    });
    it("う>うぇ>下", () => {
        expect(drive("a", ["dl", "dl.d", "dl.d.d"]).char).toBe("ヴェ");
    });
    it("う>左上", () => {
        expect(drive("a", ["dl", "dl.ul"]).char).toBe("ヴァ");
    });
    it("た>濁>づ>左下", () => {
        expect(drive("ta", ["sh:u", "dl", "dl.dl"]).char).toBe("ヅァ");
    });
    it("は>濁>ぶ>左上", () => {
        expect(drive("ha", ["sh:u", "dl", "dl.ul"]).char).toBe("ぶぁ");
    });
    it("は>半濁>ぷ>左上", () => {
        expect(drive("ha", ["sh:d", "dl", "dl.ul"]).char).toBe("ぷぁ");
    });
    it("て>上", () => {
        expect(drive("ta", ["ur", "ur.u"]).char).toBe("てぃ");
    });
    it("と>右上", () => {
        expect(drive("ta", ["dr", "dr.ur"]).char).toBe("とぅ");
    });
});

describe("ya brackets / wa / punctuation / space", () => {
    it("や>(>左下", () => {
        expect(drive("ya", ["ul", "ul.dl"]).char).toBe("「");
    });
    it("や>(>左上", () => {
        expect(drive("ya", ["ul", "ul.ul"]).char).toBe("<");
    });
    it("や>(>上", () => {
        expect(drive("ya", ["ul", "ul.u"]).char).toBe("『");
    });
    it("や>)>右下", () => {
        expect(drive("ya", ["ur", "ur.dr"]).char).toBe("」");
    });
    it("や>)>右上", () => {
        expect(drive("ya", ["ur", "ur.ur"]).char).toBe(">");
    });
    it("や>)>上", () => {
        expect(drive("ya", ["ur", "ur.u"]).char).toBe("』");
    });
    it("わ>左上", () => {
        expect(drive("wa", ["ul"]).char).toBe("を");
    });
    it("わ>上", () => {
        expect(drive("wa", ["u"]).char).toBe("ん");
    });
    it("わ>右上", () => {
        expect(drive("wa", ["ur"]).char).toBe("－");
    });
    it("わ>右上>上", () => {
        expect(drive("wa", ["ur", "ur.u"]).char).toBe("-");
    });
    it("空白(タップ)", () => {
        const r = drive("space", []);
        expect(r.char).toBe("　");
        expect(r.selCell.lab).toBe("␣");
    });
    it("空白>上", () => {
        const r = drive("space", ["u"]);
        expect(r.char).toBe(" ");
        expect(r.selCell.lab).toBe("␣");
    });
    it("空白>右上", () => {
        expect(drive("space", ["ur"]).char).toBe("・");
    });
    it("空白>右上>上", () => {
        expect(drive("space", ["ur", "ur.u"]).char).toBe("･");
    });
    it("空白>左上", () => {
        expect(drive("space", ["ul"]).char).toBe("゛");
    });
    it("空白>左上>上", () => {
        expect(drive("space", ["ul", "ul.u"]).char).toBe("゜");
    });
    it("？(pnの上)", () => {
        expect(drive("pn", ["u"]).char).toBe("？");
    });
    it("？>上", () => {
        expect(drive("pn", ["u", "u.u"]).char).toBe("?");
    });
    it("！(pnの右上)", () => {
        expect(drive("pn", ["ur"]).char).toBe("！");
    });
    it("！>上", () => {
        expect(drive("pn", ["ur", "ur.u"]).char).toBe("!");
    });
    it("。(pnの左上)", () => {
        expect(drive("pn", ["ul"]).char).toBe("。");
    });
    it("タップのみ resolves to each row's center char", () => {
        for (const key of Object.keys(ROWS) as RowKey[]) {
            expect(drive(key, []).char).toBe(ROWS[key].base.c);
        }
    });
});

describe("static checks", () => {
    it("wa / pn / space have no d / dl / dr on the base layer (bottom-row keys)", () => {
        for (const key of ["wa", "pn", "space"] as const) {
            const base = ROWS[key].base;
            expect(base.d).toBeUndefined();
            expect(base.dl).toBeUndefined();
            expect(base.dr).toBeUndefined();
        }
    });

    it("compute() never throws and always yields cells for every row/shift layer", () => {
        for (const key of Object.keys(ROWS) as RowKey[]) {
            const row = ROWS[key];
            for (const layerName of ["base", "daku", "handaku", "small"] as const) {
                if (layerName !== "base" && !row[layerName]) continue;
                const state = createState(row, 0, 0);
                state.shift = layerName === "base" ? null : layerName;
                expect(() => compute(state, 0, 0)).not.toThrow();
                const result = compute(state, 5, 5);
                expect(result.cells.length).toBeGreaterThan(0);
            }
        }
    });
});
