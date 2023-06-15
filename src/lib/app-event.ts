import { IdentityFn } from "../../shared";
import { GoalID } from "../../shared/goal";

export type AppEvent =
  | "goal-started"
  | "goal-finished"
  | "goal-cancelled"
  | "sample-event";

export type GoalHandler = (goalID: GoalID) => void;
export type SampleEventHandler = (arg: number, x: string) => void;

export interface AppDispatcher {
  handlers: Map<AppEvent, IdentityFn[]>;
}

function on(eventName: "sample-event", handler: SampleEventHandler): void;
function on(
  eventName: "goal-started" | "goal-finished" | "goal-cancelled",
  handler: GoalHandler
): void;
function on(eventName: AppEvent, handler: IdentityFn): void {
  if (!defaultDispatcher.handlers.has(eventName)) {
    defaultDispatcher.handlers.set(eventName, []);
  }
  defaultDispatcher.handlers.get(eventName)?.push(handler);
}

const off: typeof on = function (
  eventName: AppEvent,
  handler: IdentityFn
): void {
  const fns = defaultDispatcher.handlers.get(eventName);
  if (!fns) return;

  const i = fns?.indexOf(handler);
  if (i >= 0) {
    fns?.splice(i, 1);
  }
};

function dispatch(
  eventName: "goal-started" | "goal-finished" | "goal-cancelled",
  ...args: Parameters<GoalHandler>
): void;
function dispatch(
  eventName: "sample-event",
  ...args: Parameters<SampleEventHandler>
): void;
function dispatch(name: AppEvent, data?: unknown) {
  const handlers = defaultDispatcher.handlers.get(name);
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
