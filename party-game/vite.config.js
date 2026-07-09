import { defineConfig } from "vite";

export default defineConfig({
  base: "/party/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
