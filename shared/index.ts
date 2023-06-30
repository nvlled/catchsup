// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const identityFn = (..._: any[]): unknown => undefined;

export type IdentityFn = typeof identityFn;

export type Urgency = "normal" | "critical" | "low";

export type Fn = (...args: unknown[]) => unknown;

export type WrapPromise<T extends Fn> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

export type ForwardSlashPath = string & { __brand: "forward-slash-path" };

export const storageName = "catchsup-data" as ForwardSlashPath;
export const backupDirName = "backups" as ForwardSlashPath;
export const logsDirName = "notes-and-logs" as ForwardSlashPath;
export const devDataDir = ".dev-user-data" as ForwardSlashPath;

export const tempStorageName = "catchsup-data.tmp" as ForwardSlashPath;
