import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "babylon-msdf-text": path.resolve(
        __dirname,
        "../package/MSDF-Text/index.js"
      ),
    },
  },
  plugins: [],
});
