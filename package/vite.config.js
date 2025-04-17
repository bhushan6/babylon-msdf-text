/* eslint-disable no-undef */
import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "MSDF-Text/index.ts"),
      name: "babylon-msdf-text",
      formats: ["es"],
      fileName: (format) => `babylon-msdf-text.${format}.js`,
    },
    rollupOptions: {
      external: ["@babylonjs/core"],
    },
  },
});
