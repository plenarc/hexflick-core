// Pure hex-grid geometry. No DOM, no window, no side effects.
// Ported from docs/hexflick-prototype.html.

export type Dir = "u" | "d" | "ul" | "ur" | "dl" | "dr";

// Flat-top regular hexagon, sized so every neighbor shares an edge at equal distance.
export const HR = 31;
export const H = HR * Math.sqrt(3);
export const HX = HR * 1.5;
export const HY = H / 2;

export const OFF: Record<Dir, [number, number]> = {
    u: [0, -H],
    d: [0, H],
    ul: [-HX, -HY],
    ur: [HX, -HY],
    dl: [-HX, HY],
    dr: [HX, HY],
};

export const DIRS: Dir[] = ["u", "d", "ul", "ur", "dl", "dr"];

export function pos(cx: number, cy: number, dir: Dir): { x: number; y: number } {
    const [dx, dy] = OFF[dir];
    return { x: cx + dx, y: cy + dy };
}

export type Zone = Dir | "c";

// Angle-based zone classification from the original prototype. The
// finalized selection model uses nearest-cell distance instead (see
// engine.ts compute()), so this is currently unused by compute() but
// kept here for parity with the prototype and possible future use.
export function zoneOf(dx: number, dy: number, th: number): Zone {
    if (Math.hypot(dx, dy) < th) return "c";
    const d = (Math.atan2(-dy, dx) * 180) / Math.PI;
    if (d >= 60 && d < 120) return "u";
    if (d >= 120 && d <= 180) return "ul";
    if (d >= 0 && d < 60) return "ur";
    if (d >= -120 && d < -60) return "d";
    if (d >= -180 && d < -120) return "dl";
    return "dr";
}
