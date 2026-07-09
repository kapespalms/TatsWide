import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  base: "/fruity/",
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
