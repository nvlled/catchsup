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
    let start: number | null = null

    function loop(time: number) {
      console.log("elapsed", time - (start ?? 0))
      if (!start) start = time;
      if (time - (start ?? 0) < ms) {
        requestAnimationFrame(loop)
      } else {
        console.log("done")
        resolve()
      }
    }

    requestAnimationFrame(loop)
  });
}
