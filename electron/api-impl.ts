import fs from "fs";
import upath from "upath";
import tmp from "tmp";

import { Notification, Tray, app, dialog, nativeImage } from "electron";
import { ForwardSlashPath, Urgency, storageName } from "../shared";
import { mainWindow } from "./main";
import { getIconPath } from "../shared/icon-names";

export function getPublicPath() {
  const publicPath = app.isPackaged
    ? app.getAppPath() + "/dist"
    : app.getAppPath() + "/public/";

  return upath.normalize(publicPath);
}

let tray: Tray | undefined;
let lastIcon = "";

function posixPath(pathname: string): ForwardSlashPath {
  return upath.toUnix(pathname) as ForwardSlashPath;
}

// Note: all file path arguments should use /,
// they will be automatically converted to os path separator.
export const apiImpl = {
  readFile: (filename: ForwardSlashPath) => {
    return fs.readFileSync(filename, "utf-8");
  },

  writeFile: (filename: ForwardSlashPath, data: string) => {
    fs.writeFileSync(filename, data, "utf-8");
  },

  atomicWriteFile: (
    filename: ForwardSlashPath,
    data: string,
    tempFilename?: string
  ) => {
    tempFilename = posixPath(tempFilename ?? tmp.tmpNameSync());
    fs.writeFileSync(tempFilename, data, "utf-8");
    fs.renameSync(tempFilename, filename);
  },

  deleteFile: (filename: ForwardSlashPath) => {
    fs.unlinkSync(filename);
  },

  fileExists: (filename: ForwardSlashPath) => {
    return fs.existsSync(filename);
  },

  showOpenDialog: dialog.showOpenDialog,
  showSaveDialog: dialog.showSaveDialog,
  showErrorBox: dialog.showErrorBox,

  exportDataTo: async (filename: ForwardSlashPath) => {
    const sourceFile = apiImpl.withDataDir(storageName as ForwardSlashPath);
    const data = await fs.readFileSync(sourceFile, "utf-8");
    await fs.writeFileSync(filename, JSON.stringify(JSON.parse(data), null, 2));
  },

  importDataFrom: async (filename: ForwardSlashPath) => {
    const destFile = apiImpl.withDataDir(storageName as ForwardSlashPath);
    const backupFile = apiImpl.withDataDir(
      (storageName + ".backup") as ForwardSlashPath
    );
    const data = await fs.readFileSync(filename, "utf-8");

    await fs.writeFileSync(backupFile, data);
    await fs.writeFileSync(destFile, data);
  },

  showNotification(title: string, body: string, urgency: Urgency = "normal") {
    const notif = new Notification({
      title,
      body,
      urgency,
    });
    notif.show();
  },

  setTray(icon: string) {
    if (lastIcon === icon) return;
    lastIcon = icon;

    const path = getPublicPath() + (getIconPath(icon) ?? icon);

    if (!tray) {
      const img = nativeImage.createFromPath(path);
      tray = new Tray(img);
    } else {
      const img = nativeImage.createFromPath(path);
      tray.setImage(img);
    }
  },

  joinPath: (...paths: string[]) => upath.join(...paths) as ForwardSlashPath,
  toUnixPath: (p: string) => upath.toUnix(p) as ForwardSlashPath,

  requestWindowAttention(yes: boolean) {
    mainWindow?.flashFrame(yes);
  },

  getAppPath() {
    return app.getAppPath();
  },

  withDataDir(filename?: ForwardSlashPath): ForwardSlashPath {
    const dir = upath.toUnix(app.isPackaged ? app.getPath("userData") : ".");
    return (!filename ? dir : upath.join(dir, filename)) as ForwardSlashPath;
  },
  withAbsoluteDataDir(filename: ForwardSlashPath): ForwardSlashPath {
    const dir = app.isPackaged ? app.getPath("userData") : ".";
    return upath.resolve(upath.join(dir, filename)) as ForwardSlashPath;
  },

  openDevTools() {
    mainWindow?.webContents.openDevTools();
  },

  setWindowTitle(title?: string) {
    if (mainWindow)
      mainWindow.title = !title ? app.name : title + " - " + app.name;
  },
};
