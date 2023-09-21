import { IdentityFn, identityFn } from "../shared";
import { apiImpl } from "./api-impl";

type PromisedReturn<F extends IdentityFn> = (
  ...xs: Parameters<F>
) => Promise<ReturnType<F>>;

type HasKeysOf<T> = Record<keyof T, any>;

export const apiStub = {
  version: identityFn as PromisedReturn<typeof apiImpl.version>,

  readFile: identityFn as PromisedReturn<typeof apiImpl.readFile>,
  writeFile: identityFn as PromisedReturn<typeof apiImpl.writeFile>,
  atomicWriteFile: identityFn as PromisedReturn<typeof apiImpl.atomicWriteFile>,
  deleteFile: identityFn as PromisedReturn<typeof apiImpl.deleteFile>,
  fileExists: identityFn as PromisedReturn<typeof apiImpl.fileExists>,
  readDir: identityFn as PromisedReturn<typeof apiImpl.readDir>,
  mkdir: identityFn as PromisedReturn<typeof apiImpl.mkdir>,
  copyFiles: identityFn as PromisedReturn<typeof apiImpl.copyFiles>,
  readDataDir: identityFn as PromisedReturn<typeof apiImpl.readDataDir>,

  openExternal: identityFn as PromisedReturn<typeof apiImpl.openExternal>,

  showOpenDialog: identityFn as PromisedReturn<typeof apiImpl.showOpenDialog>,
  showSaveDialog: identityFn as PromisedReturn<typeof apiImpl.showSaveDialog>,
  showErrorBox: identityFn as PromisedReturn<typeof apiImpl.showErrorBox>,
  showItemInFolder: identityFn as PromisedReturn<
    typeof apiImpl.showItemInFolder
  >,

  beep: identityFn as PromisedReturn<typeof apiImpl.beep>,

  exportDataTo: identityFn as PromisedReturn<typeof apiImpl.exportDataTo>,
  importDataFrom: identityFn as PromisedReturn<typeof apiImpl.importDataFrom>,

  showNotification: identityFn as PromisedReturn<
    typeof apiImpl.showNotification
  >,

  setTray: identityFn as PromisedReturn<typeof apiImpl.setTray>,

  joinPath: identityFn as PromisedReturn<typeof apiImpl.joinPath>,
  toUnixPath: identityFn as PromisedReturn<typeof apiImpl.toUnixPath>,

  requestWindowAttention: identityFn as PromisedReturn<
    typeof apiImpl.requestWindowAttention
  >,

  getAppPath: identityFn as PromisedReturn<typeof apiImpl.getAppPath>,

  withDataDir: identityFn as PromisedReturn<typeof apiImpl.withDataDir>,
  withAbsoluteDataDir: identityFn as PromisedReturn<
    typeof apiImpl.withAbsoluteDataDir
  >,

  openDevTools: identityFn as PromisedReturn<typeof apiImpl.openDevTools>,

  setWindowTitle: identityFn as PromisedReturn<typeof apiImpl.setWindowTitle>,

  //dispatchAppEvent: identityFn as PromisedReturn<
  //  typeof apiImpl.dispatchAppEvent
  //>,
  getScreenBounds: identityFn as PromisedReturn<typeof apiImpl.getScreenBounds>,
  log: identityFn as PromisedReturn<typeof apiImpl.log>,

  getMousePos: identityFn as PromisedReturn<typeof apiImpl.getMousePos>,

  getDistractionWindowInfo: identityFn as PromisedReturn<
    typeof apiImpl.getDistractionWindowInfo
  >,

  updateDistractionWindow: identityFn as PromisedReturn<
    typeof apiImpl.updateDistractionWindow
  >,
} as const satisfies HasKeysOf<typeof apiImpl>;

export type API = typeof apiStub;
