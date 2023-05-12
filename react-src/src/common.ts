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
