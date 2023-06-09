import type { readFileSync, writeFileSync } from "fs";
import type { join as joinPath } from "path";
import type { dialog } from "electron";
import { Urgency, identityFn } from "../shared";

export const apiStub = {
  readFileSync: identityFn as typeof readFileSync,
  writeFileSync: identityFn as typeof writeFileSync,
  showOpenDialog: identityFn as typeof dialog.showOpenDialog,
  showSaveDialog: identityFn as typeof dialog.showSaveDialog,
  showErrorBox: identityFn as typeof dialog.showErrorBox,

  exportDataTo: identityFn as (filename: string) => void,
  importDataFrom: identityFn as (filename: string) => void,

  showNotification: identityFn as (
    title: string,
    body: string,
    urgency?: Urgency
  ) => void,

  setTray: identityFn as (icon: string) => void,

  joinPath: identityFn as typeof joinPath,

  requestWindowAttention: identityFn as (yes: boolean) => void,

  getAppPath: identityFn as () => string,

  withDataDir: identityFn as (filename: string) => string,
  withAbsoluteDataDir: identityFn as (filename: string) => string,
};

export type API = typeof apiStub;
