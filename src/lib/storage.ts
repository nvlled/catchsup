import { StateStorage } from "zustand/middleware";
import { api } from "./api";

export const storage = {
  getData: async (key: string): Promise<string> => {
    const filename = await api.withDataDir(key);
    return await api.readFile(filename);
  },
  setData: async (key: string, data: string): Promise<void> => {
    const filename = await api.withDataDir(key);
    api.writeFile(filename, data);
  },
};

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
