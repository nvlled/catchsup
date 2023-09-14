import { API } from "../../electron/api-stub";
import { AppEventRegistry } from "../../shared/app-event";
import { offElectronEvent, onElectronEvent } from "./electron-events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api = (window as any).api as API;

export const events = (window as any).appEventRegistry as AppEventRegistry;

export const ElectronEvents = {
  on: (window as any).onElectronEvent as typeof onElectronEvent,
  off: (window as any).offElectronEvent as typeof offElectronEvent,
};
