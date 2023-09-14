import { createLoopTimer } from "../shared/loop-timer";
import { api, events } from "./lib/api";
import {
  CoProcess,
  CoroutineGenerator,
  awaited,
  createProcess,
  sleep,
} from "./lib/coroutine";

export type Image = "shark" | "gorilla";
export type ImageAnimation = "wobble" | "idle";

const template = document.querySelector("template");
const container = document.querySelector("#img-container");
const message = document.querySelector("#message");
const shark = template?.content.querySelector("#shark");
const gorilla = template?.content.querySelector("#gorilla");

function getRandomStartPosition(screen: Electron.Rectangle) {
  const y = screen.y + screen.height * Math.random();
  const x = screen.x + screen.width * Math.random();
  return { x, y };
}

function getRandomDirection(scale: number) {
  const v = {
    x: -1 + Math.random() * 2,
    y: -1 + Math.random() * 2,
  };
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  v.x = (v.x / len) * scale;
  v.y = (v.y / len) * scale;
  return v;
}

function* changeDirection(v: { x: number; y: number }) {
  if (v.x < 0) {
    container?.classList.add("flipX");
  } else {
    container?.classList.remove("flipX");
  }

  yield* awaited(
    api.updateDistractionWindow({
      action: "setVector",
      args: [v.x, v.y],
    }),
    null
  );
}

function runCoroutine() {
  let timeStarted: number = Date.now();
  let duration: number | undefined;

  const subproc = createProcess(sharkCoroutine, false, { winSize: 100 });

  const listenerID = events.on((_, e) => {
    switch (e.type) {
      case "distraction-window-closed":
      case "stop-distraction":
      case "goal-started":
        api.log("stopping distraction");
        subproc.stop();
        timer.stop();
        break;

      case "start-distraction": {
        timeStarted = Date.now();
        subproc.restart();
        timer.start();
        duration = e.seconds;
        subproc.data.winSize = e.size ?? 100;
        break;
      }
    }
  });

  api.updateDistractionWindow({
    action: "hide",
  });

  const timer = createLoopTimer(() => {
    if (duration) {
      const elapsed = (Date.now() - timeStarted) / 1000;
      if (elapsed >= duration) {
        timer.stop();
        subproc.stop();
      }
    }
    subproc.next();
  }, 1000);

  return {
    stop() {
      events.off(listenerID);
      timer.stop();
    },
  };
}

function* sharkCoroutine(
  this: CoProcess<{ winSize: number }>
): CoroutineGenerator {
  this.defer(() => {
    api.log("coroutine exit");
    api.updateDistractionWindow({ action: "hide" });
  });

  const screen = (yield* awaited(api.getScreenBounds())) ?? {
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
  };

  const startPos = getRandomStartPosition(screen);
  const speed = 50;
  let v = getRandomDirection(speed);

  const { winSize: size } = this.data;
  api.log("shark", "init");

  yield* awaited(
    api.updateDistractionWindow(
      {
        action: "setPosition",
        args: [startPos.x, startPos.y],
      },
      { action: "setSize", args: [size, size] },
      { action: "show" }
    )
  );

  yield* changeDirection(v);
  yield* sleep(2);

  while (true) {
    api.log("shark", "loop");
    for (let i = 0; i < 30 + Math.random() * 20; i++) {
      v = getRandomDirection(speed);
      yield* changeDirection(v);
      yield* sleep(1 * Math.random() * 3);
    }
  }
}

async function main() {
  if (!message) throw "missing #message node";
  if (!shark) throw "missing #shark node";
  if (!gorilla) throw "missing #gorilla node";

  //gorilla.remove();
  shark.remove();
  container?.appendChild(shark);

  message.textContent = "";
  message.remove();
  shark.classList.add("wobbleX");

  runCoroutine();
}

window.addEventListener("load", main);
