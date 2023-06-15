// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const identityFn = (..._: any[]): unknown => undefined;

export type IdentityFn = typeof identityFn;

export type Urgency = "normal" | "critical" | "low";

export type Fn = (...args: unknown[]) => unknown;

export type WrapPromise<T extends Fn> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

export const storageName = "catchsup-data";
