import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  base: "/",
  plugins: [react()],
  define: {
    // Sanity Studio reads project config from these at build time.
    "process.env.SANITY_STUDIO_PROJECT_ID": JSON.stringify(process.env.SANITY_STUDIO_PROJECT_ID || "c558ki6i"),
    "process.env.SANITY_STUDIO_DATASET": JSON.stringify(process.env.SANITY_STUDIO_DATASET || "production"),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "../src") },
  },
  build: {
    outDir: path.resolve(__dirname, "../studio-dist"),
    emptyOutDir: true,
  },
});