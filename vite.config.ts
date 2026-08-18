import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Chel.map/",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
});
