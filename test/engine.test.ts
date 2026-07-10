import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/engine";

// Scaffold check only. Real test vectors (spec §5) land with the engine port.
describe("scaffold", () => {
    it("wires vitest against src/", () => {
        expect(DEFAULT_CONFIG).toEqual({ th: 26, cancel: 48 });
    });
});
