import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import path from "node:path";
import { apiImpl, getPublicPath } from "./api-impl";
import { IdentityFn } from "../shared";
import { mkdirSync } from "fs";
import { registerElectronEventHandlers } from "../src/lib/electron-events";

export function createHandlers(
  ns: string,
  obj: Record<string, object | IdentityFn>
) {
  for (const [k, value] of Object.entries(obj)) {
    if (typeof value === "function") {
      console.log(">", ns + "." + k);
      ipcMain.handle(
        ns + "." + k,
        (_: Electron.IpcMainInvokeEvent, ...args: unknown[]) => value(...args)
      );
    } else {
      createHandlers(
        ns + "." + k,
        value as Record<string, object | IdentityFn>
      );
    }
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
  registerElectronEventHandlers();

  mainWindow = new BrowserWindow({
    title: "catchsup" + (app.isPackaged ? "" : "-dev"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
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
    mainWindow.setMaximumSize(640, 0);
  }

  //globalShortcut.register("Y", () => {
  //  // aha this works
  //  // I can listen for any keypress!!?11
  //  // haha I can't press wai animore
  //  console.log("y pressed");
  //});
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
