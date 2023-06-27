import { Awaitable, sleep } from "./jsext";

export function createFnMux(fn: Awaitable, msInterval?: number) {
  let invoking = false;
  let queued = false;
  let sleeping = false;

  return invoke;

  async function invoke(args?: { waitInterval: boolean }) {
    const waitInterval = args?.waitInterval ?? false;

    if (sleeping && waitInterval) {
      queued = true;
      return;
    }
    if (invoking) {
      queued = true;
      return;
    }

    invoking = true;
    await fn();
    invoking = false;
    if (msInterval) {
      sleeping = true;
      await sleep(msInterval);
      sleeping = false;
    }

    if (queued) {
      queued = false;
      setTimeout(invoke);
    }
  }
}
