// Character table (ROWS) and its type definitions. No DOM, no side effects.
// Ported from docs/hexflick-prototype.html.
import type { Dir } from "./geometry";

// Entry: a plain string, a {c, sub?} character with a second-layer flick
// map, or a {shift} trigger (base layer's u/d only).
export type ShiftType = "daku" | "handaku" | "small";

export type Entry =
    | string
    | { c: string; lab?: string; sub?: Partial<Record<Dir, Entry>> }
    | { shift: ShiftType };

export interface Layer {
    c: string;
    lab?: string;
    u?: Entry;
    d?: Entry;
    ul?: Entry;
    ur?: Entry;
    dl?: Entry;
    dr?: Entry;
}

export interface Row {
    base: Layer;
    daku?: Layer;
    handaku?: Layer;
    small?: Layer;
}

export type RowKey =
    | "a"
    | "ka"
    | "sa"
    | "ta"
    | "na"
    | "ha"
    | "ma"
    | "ya"
    | "ra"
    | "wa"
    | "pn"
    | "space";

const SH = (s: ShiftType): Entry => ({ shift: s });
// Youon (small-kana digraph) layout: counter-clockwise from bottom-left.
const Y = (c: string, ya: Entry, yu: Entry, yo: Entry): Entry => ({
    c,
    sub: { dl: ya, ul: yu, u: yo },
});

export const ROWS: Record<RowKey, Row> = {
    a: {
        base: {
            c: "あ",
            ul: "い",
            dl: {
                c: "う",
                sub: {
                    ul: "ヴァ",
                    dl: { c: "うぃ", sub: { d: "ヴィ" } },
                    d: { c: "うぇ", sub: { d: "ヴェ" } },
                    dr: { c: "うぉ", sub: { d: "ヴォ" } },
                },
            },
            ur: "え",
            dr: "お",
            u: SH("small"),
            d: SH("small"),
        },
        small: { c: "ぁ", ul: "ぃ", dl: "ぅ", ur: "ぇ", dr: "ぉ" },
    },
    ka: {
        base: {
            c: "か",
            ul: Y("き", "きゃ", "きゅ", "きょ"),
            dl: "く",
            ur: "け",
            dr: "こ",
            u: SH("daku"),
            d: SH("daku"),
        },
        daku: {
            c: "が",
            ul: Y("ぎ", "ぎゃ", "ぎゅ", "ぎょ"),
            dl: "ぐ",
            ur: "げ",
            dr: "ご",
        },
    },
    sa: {
        base: {
            c: "さ",
            ul: Y("し", "しゃ", "しゅ", "しょ"),
            dl: "す",
            ur: "せ",
            dr: "そ",
            u: SH("daku"),
            d: SH("daku"),
        },
        daku: {
            c: "ざ",
            ul: Y("じ", "じゃ", "じゅ", "じょ"),
            dl: "ず",
            ur: "ぜ",
            dr: "ぞ",
        },
    },
    ta: {
        base: {
            c: "た",
            ul: Y("ち", "ちゃ", "ちゅ", "ちょ"),
            dl: { c: "つ", sub: { dl: "つぁ", d: "っ" } },
            ur: { c: "て", sub: { u: "てぃ" } },
            dr: { c: "と", sub: { ur: "とぅ" } },
            u: SH("daku"),
            d: SH("daku"),
        },
        daku: {
            c: "だ",
            ul: Y("ぢ", "ぢゃ", "ぢゅ", "ぢょ"),
            dl: { c: "づ", sub: { dl: "ヅァ" } },
            ur: { c: "で", sub: { u: "でぃ" } },
            dr: { c: "ど", sub: { ur: "どぅ" } },
        },
    },
    na: {
        base: {
            c: "な",
            ul: Y("に", "にゃ", "にゅ", "にょ"),
            dl: "ぬ",
            ur: "ね",
            dr: "の",
        },
    },
    ha: {
        base: {
            c: "は",
            ul: Y("ひ", "ひゃ", "ひゅ", "ひょ"),
            dl: {
                c: "ふ",
                sub: { ul: "ふぁ", dl: "ふぃ", d: "ふぇ", dr: "ふぉ" },
            },
            ur: "へ",
            dr: "ほ",
            u: SH("daku"),
            d: SH("handaku"),
        },
        daku: {
            c: "ば",
            ul: Y("び", "びゃ", "びゅ", "びょ"),
            dl: {
                c: "ぶ",
                sub: { ul: "ぶぁ", dl: "ぶぃ", d: "ぶぇ", dr: "ぶぉ" },
            },
            ur: "べ",
            dr: "ぼ",
        },
        handaku: {
            c: "ぱ",
            ul: Y("ぴ", "ぴゃ", "ぴゅ", "ぴょ"),
            dl: {
                c: "ぷ",
                sub: { ul: "ぷぁ", dl: "ぷぃ", d: "ぷぇ", dr: "ぷぉ" },
            },
            ur: "ぺ",
            dr: "ぽ",
        },
    },
    ma: {
        base: {
            c: "ま",
            ul: Y("み", "みゃ", "みゅ", "みょ"),
            dl: "む",
            ur: "め",
            dr: "も",
        },
    },
    ya: {
        base: {
            c: "や",
            ul: { c: "(", sub: { dl: "「", ul: "<", u: "『" } },
            dl: "ゆ",
            ur: { c: ")", sub: { dr: "」", ur: ">", u: "』" } },
            dr: "よ",
            d: SH("small"),
        },
        small: { c: "ゃ", dl: "ゅ", dr: "ょ" },
    },
    ra: {
        base: {
            c: "ら",
            ul: Y("り", "りゃ", "りゅ", "りょ"),
            dl: "る",
            ur: "れ",
            dr: "ろ",
        },
    },
    wa: {
        base: {
            c: "わ",
            u: "ん",
            ul: "を",
            ur: { c: "－", sub: { u: "-" } },
        },
    },
    pn: {
        base: {
            c: "、",
            ul: "。",
            u: { c: "？", sub: { u: "?" } },
            ur: { c: "！", sub: { u: "!" } },
        },
    },
    space: {
        base: {
            c: "　",
            lab: "␣",
            u: { c: " ", lab: "␣" },
            ul: { c: "゛", sub: { u: "゜" } },
            ur: { c: "・", sub: { u: "･" } },
        },
    },
};

export const HINT: Record<ShiftType, string> = {
    daku: "゛",
    handaku: "゜",
    small: "小",
};

export const isShift = (e: Entry | undefined): e is { shift: ShiftType } =>
    e != null && typeof e === "object" && "shift" in e;

// Never called with a {shift} entry in practice: shift triggers only ever
// occur as base layer u/d fields, guarded by isShift() at every call site.
type CharEntry = Exclude<Entry, { shift: ShiftType }>;

export const echar = (e: CharEntry): string => (typeof e === "string" ? e : e.c);

export const elabel = (e: CharEntry): string =>
    typeof e === "object" && e.lab ? e.lab : echar(e);

export const subOf = (e: Entry | undefined): Partial<Record<Dir, Entry>> | null =>
    e != null && typeof e === "object" && "sub" in e && e.sub ? e.sub : null;

// Structural param (not engine.ts's State) to avoid a circular import.
export const layerOf = (st: { row: Row; shift: ShiftType | null }): Layer =>
    st.shift ? (st.row[st.shift] as Layer) : st.row.base;
