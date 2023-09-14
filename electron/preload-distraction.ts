import { contextBridge } from "electron";
import { createInvokers } from "./preload-common";
import { apiStub } from "./api-stub";
import { appEventRegistry } from "../shared/app-event";
console.log("preload");

//ipcRenderer.on("set-message", (e, text: string) => {
//  console.log("set-message", { text });
//});

//contextBridge.exposeInMainWorld("electronAPI", {
//  listen(callback: Handler) {
//    ipcRenderer.on("command", (e, cmd: IPCMainEvent) => {
//      callback(cmd);
//    });
//  },
//  async run<T extends Command>(command: T): Promise<T> {
//    const resp = await ipcRenderer.invoke("run-command", command);
//    switch (command.type) {
//      case "setWindowSpeed": {
//        return { ...command, result: resp as number };
//      }
//    }
//  },
//} satisfies DistractionAPI);

contextBridge.exposeInMainWorld("api", createInvokers("api", apiStub));
contextBridge.exposeInMainWorld("appEventRegistry", appEventRegistry);
