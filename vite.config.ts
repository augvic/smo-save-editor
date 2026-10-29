import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const repo = fileURLToPath(new URL(".", import.meta.url));
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ command }) => ({
  // The interface lives in the software folder; this file only says how to build and serve it.
  root: resolve(repo, "smo_save_editor/app"),
  // The dev fixtures in /public hold real save data: serve them while developing, never ship them.
  publicDir: command === "serve" ? resolve(repo, "public") : false,
  build: { outDir: resolve(repo, "dist"), emptyOutDir: true },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
