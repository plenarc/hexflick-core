// DOM wiring only (draw / start / move / end / abort / PointerEvents).
// No input-resolution logic here -- that lives in ../src. Ported from
// docs/hexflick-prototype.html.
import { compute, createState, DEFAULT_CONFIG, type Config, type ComputeResult, type State } from "../src/engine";
import { ROWS, type Row, type RowKey } from "../src/layout";

// ===== output =====
const outEl = document.getElementById("output")!;
const pathBar = document.getElementById("path-bar")!;
let text = "";

function render() {
    outEl.textContent = text;
    const caret = document.createElement("span");
    caret.className = "caret";
    outEl.appendChild(caret);
    outEl.scrollTop = outEl.scrollHeight;
}
function commit(ch: string) {
    text += ch;
    render();
}
function backspace() {
    text = Array.from(text).slice(0, -1).join("");
    render();
}
render();

// ===== tuning =====
// th:26 / cancel:48 are the prototype's provisional defaults; the sliders
// let real-device testing override them without touching core.
let cfg: Config = { ...DEFAULT_CONFIG };
const thEl = document.getElementById("th") as HTMLInputElement;
const crEl = document.getElementById("cr") as HTMLInputElement;
const thVal = document.getElementById("th-val")!;
const crVal = document.getElementById("cr-val")!;
thEl.oninput = () => {
    cfg = { ...cfg, th: +thEl.value };
    thVal.textContent = cfg.th + "px";
};
crEl.oninput = () => {
    cfg = { ...cfg, cancel: +crEl.value };
    crVal.textContent = cfg.cancel + "px";
};

// ===== drawing =====
const popup = document.getElementById("popup")!;
function addCell(ch: string, x: number, y: number, cls: string) {
    const d = document.createElement("div");
    d.className = "pcell" + (cls ? " " + cls : "") + (Array.from(ch).length >= 2 ? " two" : "");
    d.textContent = ch;
    d.style.left = x + "px";
    d.style.top = y + "px";
    popup.appendChild(d);
}
function draw(state: State, info: ComputeResult) {
    popup.querySelectorAll(".pcell").forEach((e) => e.remove());
    popup.style.display = "block";
    for (const c of info.cells) {
        let cls = "";
        if (c.kind === "shift") {
            if (state.shift === c.shiftType && state.shiftDir === c.dir) cls = "shifton";
            else if (!state.rootDir) cls = "hint"; // mid-drill: show as a plain cell, no background
        }
        if (info.selCell === c) cls = "sel";
        addCell(c.lab != null ? c.lab : c.ch, c.x, c.y, cls);
    }
}

// ===== stroke wiring =====
interface Stroke {
    state: State;
    keyEl: HTMLElement;
    info: ComputeResult;
}
let stroke: Stroke | null = null;

const SHIFT_TAG: Record<string, string> = { daku: "゛", handaku: "゜", small: "小" };

function start(keyEl: HTMLElement, row: Row, cx: number, cy: number) {
    const state = createState(row, cx, cy);
    keyEl.classList.add("pressed");
    const info = compute(state, cx, cy, cfg);
    stroke = { state, keyEl, info };
    draw(state, info);
    pathBar.textContent = info.char;
}
function move(x: number, y: number) {
    if (!stroke) return;
    const info = compute(stroke.state, x, y, cfg);
    stroke.info = info;
    popup.classList.toggle("cancel", info.cancel);
    draw(stroke.state, info);
    const tag = stroke.state.shift ? SHIFT_TAG[stroke.state.shift] + " " : "";
    pathBar.textContent = tag + (info.cancel ? "—" : info.char);
}
function end() {
    if (!stroke) return;
    if (!stroke.info.cancel) commit(stroke.info.char);
    stroke.keyEl.classList.remove("pressed");
    popup.style.display = "none";
    popup.classList.remove("cancel");
    stroke = null;
    setTimeout(() => {
        if (!stroke) pathBar.innerHTML = "&nbsp;";
    }, 700);
}
function abort() {
    if (!stroke) return;
    stroke.keyEl.classList.remove("pressed");
    popup.style.display = "none";
    popup.classList.remove("cancel");
    stroke = null;
    pathBar.innerHTML = "&nbsp;";
}

// ===== PointerEvents =====
const kb = document.getElementById("keyboard")!;
kb.addEventListener("pointerdown", (e) => {
    const k = (e.target as HTMLElement).closest<HTMLElement>(".key");
    if (!k || k.classList.contains("disabled")) return;
    e.preventDefault();
    const act = k.dataset.action;
    if (act) {
        k.classList.add("pressed");
        setTimeout(() => k.classList.remove("pressed"), 120);
        if (act === "bs") backspace();
        if (act === "space") commit(" ");
        if (act === "enter") commit("\n");
        return;
    }
    const rowKey = k.dataset.row as RowKey | undefined;
    if (!rowKey || !ROWS[rowKey]) return;
    const r = k.getBoundingClientRect();
    kb.setPointerCapture(e.pointerId);
    start(k, ROWS[rowKey], r.left + r.width / 2, r.top + r.height / 2);
});
kb.addEventListener("pointermove", (e) => {
    if (!stroke) return;
    e.preventDefault();
    move(e.clientX, e.clientY);
});
kb.addEventListener("pointerup", (e) => {
    if (!stroke) return;
    e.preventDefault();
    end();
});
kb.addEventListener("pointercancel", abort);
window.addEventListener("blur", abort);
