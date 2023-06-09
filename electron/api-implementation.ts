import { default as fsp } from "fs/promises";
import { default as fs } from "fs";

import path from "path";
import { Notification, Tray, app, dialog, nativeImage } from "electron";
import { API } from "./api-stub";
import { Urgency, storageName } from "../shared";
import { mainWindow } from "./main";

export function getPublicPath() {
  const publicPath = app.isPackaged
    ? app.getAppPath() + "/dist"
    : app.getAppPath() + "/public/";

  return path.normalize(publicPath);
}

export const iconNames = {
  "due-now": "/icons/due-now.png",
  "due-later": "/icons/due-later.png",
  "was-due": "/icons/was-due.png",
  "time-up": "/icons/time-up.png",
  ongoing: "/icons/ongoing.png",
  blank: "/logo.png",
} as Record<string, string>;

let tray: Tray | undefined;
let lastIcon = "";

export const apiImpl: API = {
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
  showOpenDialog: dialog.showOpenDialog,
  showSaveDialog: dialog.showSaveDialog,
  showErrorBox: dialog.showErrorBox,

  exportDataTo: async (filename: string) => {
    const sourceFile = apiImpl.withDataDir(storageName);
    const data = await fsp.readFile(sourceFile, "utf-8");
    await fsp.writeFile(filename, JSON.stringify(JSON.parse(data), null, 2));
  },

  importDataFrom: async (filename: string) => {
    const destFile = apiImpl.withDataDir(storageName);
    const backupFile = apiImpl.withDataDir(storageName + ".backup");
    const data = await fsp.readFile(filename, "utf-8");
    //const obj = JSON.parse(data);

    await fsp.writeFile(backupFile, data);
    await fsp.writeFile(destFile, data);
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

    const path = getPublicPath() + (iconNames[icon] ?? icon);
    console.log({ path });

    if (!tray) {
      const img = nativeImage.createFromPath(path);
      tray = new Tray(img);
    } else {
      const img = nativeImage.createFromPath(path);
      tray.setImage(img);
    }
  },

  joinPath: path.join,

  requestWindowAttention(yes: boolean) {
    mainWindow?.flashFrame(yes);
  },

  getAppPath() {
    return app.getAppPath();
  },

  withDataDir(filename: string) {
    const dir = app.isPackaged ? app.getPath("userData") : ".";
    return path.join(dir, filename);
  },
  withAbsoluteDataDir(filename: string) {
    const dir = app.isPackaged ? app.getPath("userData") : ".";
    return path.resolve(path.join(dir, filename));
  },
};
