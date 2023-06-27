import { ForwardSlashPath } from "../../shared";
import { api } from "./api";

let dataDir: ForwardSlashPath | null = null;

export const storage = {
  async getItem(name: string): Promise<string | null> {
    dataDir ??= await api.withDataDir();
    return await api.readFile((dataDir + "/" + name) as ForwardSlashPath);
  },
  async setItem(name: string, value: string): Promise<void> {
    dataDir ??= await api.withDataDir();
    const filename = (dataDir + "/" + name) as ForwardSlashPath;
    await api.atomicWriteFile(filename, value);
  },
  //async atomicSetItem(name: string, value: string): Promise<void> {
  //  const filename = (dataDir + "/" + name) as ForwardSlashPath;
  //  await api.atomicWriteFile(filename, tempStorageName, value);
  //},
  async removeItem(name: string): Promise<void> {
    dataDir ??= await api.withDataDir();
    const filename = (dataDir + "/" + name) as ForwardSlashPath;
    await api.deleteFile(filename);
  },
  async hasItem(name: string): Promise<boolean> {
    dataDir ??= await api.withDataDir();
    const filename = (dataDir + "/" + name) as ForwardSlashPath;
    return await api.fileExists(filename);
  },
};
