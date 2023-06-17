import { IdentityFn } from "../../shared";
import { GoalID } from "../../shared/goal";

export type AppEvent =
  | "goal-started"
  | "goal-timeup"
  | "goal-modified"
  | "goal-finished"
  | "goal-cancelled"
  | "sample-event";

export type GoalHandler = (goalID: GoalID) => void;
export type SampleEventHandler = (arg: number, x: string) => void;

export interface AppDispatcher {
  handlers: Map<string, IdentityFn[]>;
}

function on(eventName: "sample-event", handler: SampleEventHandler): void;
function on(eventName: AppEvent, handler: GoalHandler): void;
function on(eventName: string, handler: IdentityFn): void {
  if (!defaultDispatcher.handlers.has(eventName)) {
    defaultDispatcher.handlers.set(eventName, []);
  }
  defaultDispatcher.handlers.get(eventName)?.push(handler);
  console.log(
    "on app event",
    eventName,
    defaultDispatcher.handlers.get(eventName)
  );
}

const off: typeof on = function (
  eventName: AppEvent,
  handler: IdentityFn
): void {
  const fns = defaultDispatcher.handlers.get(eventName);
  if (!fns) return;
  console.log("off", eventName);

  const i = fns?.indexOf(handler);
  if (i >= 0) {
    fns?.splice(i, 1);
  }
};

function dispatch(eventName: AppEvent, ...args: Parameters<GoalHandler>): void;
function dispatch(
  eventName: "sample-event",
  ...args: Parameters<SampleEventHandler>
): void;
function dispatch(name: string, data?: unknown) {
  const handlers = defaultDispatcher.handlers.get(name);
  console.log("dispatch", name, { handlers });
  if (handlers) {
    for (const fn of handlers) {
      fn(data);
    }
  }
}

const defaultDispatcher: AppDispatcher = {
  handlers: new Map<AppEvent, IdentityFn[]>(),
};

export const AppEvent = {
  dispatch,
  on,
  off,
};
