export function* frameDelay(frames: number) {
  for (let i = 0; i < frames; i++) {
    yield;
  }
  return frames;
}

export function* sleep(seconds: number) {
  const now = Date.now();
  while ((Date.now() - now) / 1000 < seconds) {
    yield;
  }
}

export function* waitOne(...gs: Generator[]) {
  while (true) {
    let someDone = false;
    for (const g of gs) {
      const v = g.next();
      someDone ||= !!v.done;
    }
    if (someDone) break;
    yield;
  }
  for (const g of gs) {
    g.return(undefined);
  }
}

export function* waitAll(...gs: Generator[]) {
  while (true) {
    let allDone = true;
    for (const g of gs) {
      const v = g.next();
      allDone &&= !!v.done;
    }
    if (allDone) break;
    yield;
  }
}

export function* awaited<T>(
  p: Promise<T>,
  defaultValue?: T | undefined
): Generator<undefined, T | undefined, unknown> {
  let done = false;
  let value: T | undefined = defaultValue;
  p.then((x: T) => {
    done = true;
    value = x;
  }).catch((reason) => {
    done = true;
    throw reason;
  });
  while (!done) {
    yield;
  }
  return value;
}

export type CoroutineGenerator = Generator<undefined, void, unknown>;

export function* idle(): CoroutineGenerator {
  while (true) yield;
}

export type DefaultData = Record<string, any>;

export type Action = () => void | unknown;

export interface CoProcess<T = DefaultData> {
  id: string | number | undefined;
  start(): void;
  stop(): void;
  restart(): void;
  pause(): void;
  resume(): void;
  defer(action: Action): void;
  next(): void;
  get running(): boolean;

  data: T;

  create(proc: CoProcessFn<T>, autoStart?: boolean): SubCoProcess<T>;
}

export type SubCoProcess<T = DefaultData> = Omit<CoProcess<T>, "next">;

export type CoProcessFn<T = DefaultData> = (
  this: CoProcess<T>
) => CoroutineGenerator;

const ActionFlagEnum = {
  nop: 1,
  start: 1,
  stop: 2,
  restart: 4,
};

type FlagName = keyof typeof ActionFlagEnum;
type ActionFlags = number;

const ActionFlags = {
  set(flags: ActionFlags, flag: FlagName) {
    return flags | ActionFlagEnum[flag];
  },
  unset(flags: ActionFlags, flag: FlagName) {
    return flags & ~ActionFlagEnum[flag];
  },
  isSet(flags: ActionFlags, flag: FlagName) {
    return (flags & ActionFlagEnum[flag]) != 0;
  },
};
ActionFlags.isSet(0, "restart");

export function createProcess<T = DefaultData>(
  proc: CoProcessFn<T>,
  autoStart = true,
  initData: T = {} as T
): CoProcess<T> {
  const deferred: Action[] = [];
  const controls: CoProcess<T>[] = [];
  const self: CoProcess<T> = {
    id: undefined,
    start,
    stop,
    restart,
    pause,
    resume,
    next,
    create,
    defer,

    get running() {
      return running;
    },

    data: initData,
  };

  let flags: ActionFlags = 0;
  let running = false;
  let paused = false;
  let g: CoroutineGenerator = proc.apply(self);

  if (autoStart) {
    running = true;
    g = proc.apply(self);
  }

  return self;

  function onStop() {
    for (const c of controls) {
      c.stop();
    }
    paused = false;
    running = false;
    g.return();

    for (const action of deferred) {
      action();
    }

    deferred.splice(0);
    controls.splice(0);
  }

  function start() {
    flags = ActionFlags.set(flags, "start");
  }
  function stop() {
    if (running) {
      onStop();
    }
  }

  function restart() {
    flags = ActionFlags.set(flags, "start");
  }

  function pause() {
    if (!paused) console.log("pause", self.id);
    paused = true;
  }

  function resume() {
    if (paused) console.log("resume", self.id);
    paused = false;
  }

  function create(subProc: CoProcessFn<T>, autoStart = true): SubCoProcess<T> {
    const ctrl = createProcess<T>(subProc, autoStart, initData);
    ctrl.id = self.id;
    if (autoStart) ctrl.start();
    controls.push(ctrl);
    return ctrl;
  }

  function next() {
    if (!paused && running) {
      const x = g.next();
      if (x.done) {
        onStop();
        running = false;
        paused = false;
      } else {
        for (const c of controls) {
          c.next();
        }
      }
    }

    if (ActionFlags.isSet(flags, "start")) {
      flags = ActionFlags.unset(flags, "start");
      if (!running) {
        running = true;
        g = proc.apply(self);
      }
    }
  }

  function defer(action: Action) {
    deferred.push(action);
  }
}
