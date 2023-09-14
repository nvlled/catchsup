import { Action } from "../src/lib/jsext";

export function createLoopTimer(fn: Action, interval: number) {
  let id: NodeJS.Timer | undefined;

  return {
    start,
    stop,
    next,
    get interval() {
      return 0;
    },
    set interval(value: number) {
      interval = value;
      stop();
      start;
    },
  };

  function start() {
    if (!id) {
      id = setInterval(fn, interval);
    }
  }

  function stop() {
    clearInterval(id);
    id = undefined;
  }

  function next() {
    fn();
  }
}
