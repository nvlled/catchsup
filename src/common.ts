let initialized = false;
export function setInitialized() {
  initialized = true;
}

export function isInitialized() {
  return initialized;
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function nap(ms: number) {
  return new Promise<void>((resolve) => {
    let start: number | null = null;

    function loop(time: number) {
      if (!start) start = time;
      if (time - (start ?? 0) < ms) {
        requestAnimationFrame(loop);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(loop);
  });
}
