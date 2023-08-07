/* eslint-disable no-undef */
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: path.resolve(__dirname, "MSDF-Text/index.js"),
      name: "babylon-msdf-text",
      formats: ["es"],
      fileName: (format) => `babylon-msdf-text.${format}.js`,
    },
    rollupOptions: {
      external: ["@babylonjs/core"],
    },
  },
});
