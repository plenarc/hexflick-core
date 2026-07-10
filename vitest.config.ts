import { defineConfig } from "vitest/config";

// Separate from vite.config.ts (whose root is demo/) so tests run
// against src/ without pulling in the demo's DOM-oriented build setup.
export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        environment: "node",
    },
});
