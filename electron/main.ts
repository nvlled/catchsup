import { app, BrowserView, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { apiImpl, getPublicPath } from "./api-implementation";
import { IdentityFn } from "../shared";
import { mkdirSync } from "fs";
import { call, callWith } from "../src/lib/jsext";

export function createHandlers(ns: string, obj: Record<string, IdentityFn>) {
  for (const [k, fn] of Object.entries(obj)) {
    ipcMain.handle(
      ns + ":" + k,
      (_: Electron.IpcMainInvokeEvent, ...args: any[]) => fn(...args)
    );
  }
}

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, "../dist");
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

export let mainWindow: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

function createWindow() {
  initStorage();
  createHandlers("api", apiImpl);

  mainWindow = new BrowserWindow({
    title: "catchsup" + (app.isPackaged ? "" : "-dev"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    //icon: getPublicPath() + "/icons/icon.png",
  });

  mainWindow.setIcon(getPublicPath() + "/icons/icon.png");

  mainWindow.on("close", () => {
    app.exit(0);
  });

  // Test active push message to Renderer-process.
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send(
      "main-process-message",
      new Date().toLocaleString()
    );
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(process.env.DIST, "index.html"));
  }
}

function initStorage() {
  const dataDir = apiImpl.withDataDir("");
  mkdirSync(dataDir, { recursive: true });
}

app.on("window-all-closed", () => {
  mainWindow = null;
});

app.whenReady().then(createWindow);
app.applicationMenu = null;
