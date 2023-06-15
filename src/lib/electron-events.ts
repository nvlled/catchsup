import { app, ipcRenderer, powerMonitor } from "electron";
import { IdentityFn } from "../../shared";
import { assertUnreachable } from "../../shared/assert";

const electronEvents = [
  "lock-screen",
  "unlock-screen",
  "on-battery",
  "suspend",
  "resume",
] as const;
export type ElectronEvent = (typeof electronEvents)[number];

export type Handler = () => void;

interface Dispatcher {
  handlers: Map<string, IdentityFn[]>;
}

export function onElectronEvent(
  eventName: ElectronEvent,
  handler: Handler
): void;
export function onElectronEvent(eventName: string, handler: IdentityFn): void {
  if (!electronEvents.includes(eventName as ElectronEvent)) {
    throw "no u";
  }
  ipcRenderer.on(eventName, (_: Electron.IpcRendererEvent, ...args: any[]) => {
    handler(...args);
  });
}

export const offElectronEvent: typeof onElectronEvent = function (
  eventName: ElectronEvent,
  handler: IdentityFn
): void {
  ipcRenderer.off(eventName, (_: Electron.IpcRendererEvent, ...args: any[]) => {
    handler(...args);
  });
};

const defaultDispatcher: Dispatcher = {
  handlers: new Map<string, IdentityFn[]>(),
};

export function dispatchElectronEvent(
  eventName: ElectronEvent,
  ...args: Parameters<Handler>
): void;
export function dispatchElectronEvent(name: string, data?: unknown) {
  const handlers = defaultDispatcher.handlers.get(name);
  if (handlers) {
    for (const fn of handlers) {
      fn(data);
    }
  }
}

export function registerElectronEventHandlers() {
  for (const e of electronEvents) {
    console.log("registering", e);
    switch (e) {
      case "lock-screen":
        powerMonitor.on(e, () => {
          dispatchElectronEvent(e);
        });
        break;
      case "suspend":
        powerMonitor.on(e, () => {
          dispatchElectronEvent(e);
        });
        break;
      case "resume":
        powerMonitor.on(e, () => {
          dispatchElectronEvent(e);
        });
        break;
      case "unlock-screen":
        powerMonitor.on(e, () => dispatchElectronEvent(e));
        break;
      case "on-battery":
        powerMonitor.on(e, () => dispatchElectronEvent(e));
        break;
      default:
        assertUnreachable(e);
    }
  }
}
