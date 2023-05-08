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

/*
export function createJSONStorage<S>(
  getStorage: () => StateStorage,
  options?: JsonStorageOptions
): PersistStorage<S> | undefined {
  let storage: StateStorage | undefined;
  try {
    storage = getStorage();
  } catch (e) {
    // prevent error if the storage is not defined (e.g. when server side rendering a page)
    return;
  }

  const persistStorage: PersistStorage<S> = {
    getItem: (name) => {
      const parse = (str: string | null) => {
        if (str === null) {
          return null;
        }
        return JSON.parse(str, options?.reviver) as StorageValue<S>;
      };
      const str = (storage as StateStorage).getItem(name) ?? null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name, newValue) =>
      (storage as StateStorage).setItem(
        name,
        JSON.stringify(newValue, options?.replacer)
      ),
    removeItem: (name) => (storage as StateStorage).removeItem(name),
  };
  return persistStorage;
}

 */
