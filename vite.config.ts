import { defineConfig } from "vite";

// Demo (hexflick-web) is built from demo/ so the GitHub Pages output
// stays isolated from the core library source.
export default defineConfig({
    root: "demo",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
    },
});
