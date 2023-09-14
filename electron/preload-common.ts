import { ipcRenderer } from "electron";

export function createInvokers(ns: string, obj: object) {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "function") {
      result[k] = async (...args: unknown[]) => {
        //console.log("@" + ns + "." + k);
        const res = await ipcRenderer.invoke(ns + "." + k, ...args);
        return await Promise.resolve(res);
      };
    } else if (typeof v === "object") {
      result[k] = createInvokers(ns + "." + k, v);
    } else {
      result[k] = v;
    }
  }
  return result;
}
