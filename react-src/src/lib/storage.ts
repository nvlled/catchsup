import { storage } from "@neutralinojs/lib";
import { StateStorage } from "zustand/middleware";

export const NeuStorage: StateStorage = {
  getItem: (name: string): string | null | Promise<string | null> => {
    return storage.getData(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    return storage.setData(name, value);
  },
  removeItem: (name: string): void | Promise<void> => {
    return storage.setData(name, "");
  },
};
