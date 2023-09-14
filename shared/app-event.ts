import { IpcRendererEvent, ipcRenderer } from "electron";
import { GoalID } from "./goal";

export const appEventChannel = "app-event";

export type AppEvent =
  | { type: "goal-started"; id: GoalID }
  | { type: "goal-timeup"; id: GoalID }
  | { type: "goal-modified"; id: GoalID }
  | { type: "goal-finished"; id: GoalID }
  | { type: "goal-cancelled"; id: GoalID }
  | { type: "settings-updated" }
  | { type: "test-event"; message: string }
  | { type: "start-distraction"; size?: number; seconds?: number }
  | { type: "stop-distraction" }
  | { type: "distraction-window-closed" }
  | { type: "no-disturb-change"; isOn: boolean };

export type AppEventGroup = {
  on(handler: (e: IpcRendererEvent, event: AppEvent) => void): number;
  off(id: number): void;
  clear(): void;
};

export type AppEventRegistry = {
  on(handler: (e: IpcRendererEvent, event: AppEvent) => void): number;
  off(id: number): void;
  dispatch(event: AppEvent): void;
  group(): AppEventGroup;
};

export function createAppEventRegistry() {
  type Handler = {
    (e: IpcRendererEvent, event: AppEvent): void;
    id?: number;
  };

  const listeners = new Map<number, Handler>();
  let idCounter = 0;

  const registry: AppEventRegistry = {
    group(): AppEventGroup {
      const ids = new Set<number>();

      return {
        on,
        off,
        clear,
      };

      function on(handler: (e: IpcRendererEvent, event: AppEvent) => void) {
        const id = registry.on(handler);
        ids.add(id);
        return id;
      }

      function off(id: number) {
        ids.delete(id);
        registry.off(id);
      }

      function clear() {
        for (const id of ids) {
          registry.off(id);
        }
        ids.clear();
      }
    },
    on: function (handler: (e: IpcRendererEvent, event: AppEvent) => void) {
      const fn: Handler = (e: IpcRendererEvent, event: AppEvent) => {
        handler(e, event);
      };
      fn.id = ++idCounter;

      ipcRenderer.addListener(appEventChannel, fn);
      listeners.set(fn.id, fn);
      return fn.id;
    },
    off: function (id: number): void {
      const fn = listeners.get(id);
      if (fn) {
        ipcRenderer.off(appEventChannel, fn);
        listeners.delete(id);
      }
    },
    dispatch(event: AppEvent) {
      ipcRenderer.invoke(appEventChannel, event);
    },
  };
  return registry;
}

export const appEventRegistry = createAppEventRegistry();

/*
export type AppEvent =
  | "goal-started"
  | "goal-timeup"
  | "goal-modified"
  | "goal-finished"
  | "goal-cancelled"
  | "settings-updated"
  | "sample-event";

export type Handler = () => void;
export type GoalHandler = (goalID: GoalID) => void;
export type SampleEventHandler = (arg: number, x: string) => void;

//export interface AppDispatcher {
//  handlers: Map<string, IdentityFn[]>;
//}

function on(eventName: "sample-event", handler: SampleEventHandler): void;
function on(eventName: "settings-updated", handler: Handler): void;
function on(eventName: AppEvent, handler: GoalHandler): void;
function on(eventName: string, handler: IdentityFn): void {
  // stub
}

const off: typeof on = function (
  eventName: AppEvent,
  handler: IdentityFn
): void {
  // stub
};

type Dispatch = (eventName: AppEvent) => void

function dispatch(
  eventName: "settings-updated",
  ...args: Parameters<Handler>
): void;
function dispatch(eventName: AppEvent, ...args: Parameters<GoalHandler>): void;
function dispatch(
  eventName: "sample-event",
  ...args: Parameters<SampleEventHandler>
): void;
function dispatch(name: string, data?: unknown) {
  // stub
}

//const defaultDispatcher: AppDispatcher = {
//  handlers: new Map<AppEvent, IdentityFn[]>(),
//};

export const AppEvent = {
  dispatch,
  on,
  off,
};

*/
