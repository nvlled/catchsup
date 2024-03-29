import { resolve } from "path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: "electron/main.ts",
      },
      {
        entry: "electron/preload-distraction.ts",
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload();
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        nested: resolve(__dirname, "distraction.html"),
      },
    },
  },
});
