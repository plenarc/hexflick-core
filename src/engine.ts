// Selection-resolution engine (compute / buildCells / createState). Pure.
// Ported from docs/hexflick-prototype.html. Pending migration.

export interface Config {
    th: number;
    cancel: number;
    hr?: number;
}

// Provisional tuning values from the prototype; expect to be overridden
// once real-device testing settles on final numbers.
export const DEFAULT_CONFIG: Config = { th: 26, cancel: 48 };
