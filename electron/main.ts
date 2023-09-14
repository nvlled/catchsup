import path from "node:path";
import { app, ipcMain } from "electron";
import { apiImpl } from "./api-impl";
import { backupDirName, devDataDir, logsDirName } from "../shared";
import { mkdirSync } from "fs";
import { registerElectronEventHandlers } from "../src/lib/electron-events";
import {
  createDistractionWindow,
  createMainWindow,
  distractionWindow,
  mainWindow,
} from "./window";
import { appEventChannel } from "../shared/app-event";

process.env.DIST = path.join(__dirname, "../dist");
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

export function createHandlers(ns: string, obj: object) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "function") {
      //const res = await ipcRenderer.invoke(ns + "." + k, ...args);
      ipcMain.handle(
        ns + "." + k,
        (_: Electron.IpcMainInvokeEvent, ...args: unknown[]) => {
          //console.log("handle", ns + "." + k);
          return v(...args);
        }
      );
    } else if (typeof v === "object") {
      createHandlers(ns + "." + k, v);
    }
  }
}

ipcMain.handle(appEventChannel, (_, appEvent) => {
  console.log("ipcMain handle", appEvent);
  mainWindow?.webContents.send(appEventChannel, appEvent);
  distractionWindow?.webContents.send(appEventChannel, appEvent);
});

//export function createDistractionHandlers() {
//  ipcMain.handle("run-command", (e, cmd: Command) => {
//    if (!distractionWindow) return;
//    switch (cmd.type) {
//      case "setWindowSpeed": {
//        distractionWindow;
//      }
//    }
//  });
//}

//function browserSend(browser: BrowserWindow, cmd: IPCMainEvent) {
//  browser.webContents.send("command", cmd);
//}

function load() {
  initFilesystem();
  createHandlers("api", apiImpl);
  registerElectronEventHandlers();
  createMainWindow();
  createDistractionWindow();
  app.requestSingleInstanceLock();
}

function initFilesystem() {
  const dataDir = apiImpl.withDataDir();
  const backupDir = apiImpl.withDataDir(backupDirName);
  const logsDir = apiImpl.withDataDir(logsDirName);
  mkdirSync(devDataDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(backupDir, { recursive: true });
  mkdirSync(logsDir, { recursive: true });
}

//app.on("window-all-closed", () => {
//  mainWindow = null;
//});

app.whenReady().then(load);
app.applicationMenu = null;
