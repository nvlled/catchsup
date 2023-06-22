import { IdentityFn, identityFn } from "../shared";
import { apiImpl } from "./api-impl";

type PromisedReturn<F extends IdentityFn> = (
  ...xs: Parameters<F>
) => Promise<ReturnType<F>>;

export const apiStub = {
  readFile: identityFn as PromisedReturn<typeof apiImpl.readFile>,
  writeFile: identityFn as PromisedReturn<typeof apiImpl.writeFile>,
  showOpenDialog: identityFn as PromisedReturn<typeof apiImpl.showOpenDialog>,
  showSaveDialog: identityFn as PromisedReturn<typeof apiImpl.showSaveDialog>,
  showErrorBox: identityFn as PromisedReturn<typeof apiImpl.showErrorBox>,

  exportDataTo: identityFn as PromisedReturn<typeof apiImpl.exportDataTo>,
  importDataFrom: identityFn as PromisedReturn<typeof apiImpl.importDataFrom>,

  showNotification: identityFn as PromisedReturn<
    typeof apiImpl.showNotification
  >,

  setTray: identityFn as PromisedReturn<typeof apiImpl.setTray>,

  joinPath: identityFn as PromisedReturn<typeof apiImpl.joinPath>,

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
} as const;

export type API = typeof apiStub;
