import path from "node:path";
import { BrowserWindow, app, screen } from "electron";
import { getPublicPath } from "./api-impl";
import { appEventRegistry } from "../shared/app-event";
import { Vector } from "../shared/vec";

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export let mainWindow: BrowserWindow | null;
export let distractionWindow: BrowserWindow | null;
export const windowMover = createWindowMover();

export function createMainWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    title: "catchsup" + (app.isPackaged ? "" : "-dev"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.setIcon(getPublicPath() + "/icons/icon.png");

  mainWindow.on("close", () => {
    app.exit(0);
  });

  // Test active push message to Renderer-process.
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send(
      "main-process-message",
      new Date().toLocaleString()
    );
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(process.env.DIST, "index.html"));
    mainWindow.setMaximumSize(640, 0);
  }
}

export function createDistractionWindow() {
  if (distractionWindow) return;

  distractionWindow = new BrowserWindow({
    title: "catchsup-distraction",
    alwaysOnTop: true,
    opacity: 0.9,
    transparent: true,
    skipTaskbar: true,
    frame: false,
    focusable: false,
    webPreferences: {
      enablePreferredSizeMode: true,
      preload: path.join(__dirname, "preload-distraction.js"),
    },
  });

  const url = VITE_DEV_SERVER_URL + "distraction.html";
  console.log("dev server URL", url);

  distractionWindow.setSize(200, 200);
  distractionWindow.on("close", (e) => {
    e.preventDefault();
    distractionWindow?.hide();
    appEventRegistry.dispatch({ type: "distraction-window-closed" });
  });
  distractionWindow.setSkipTaskbar(true);
  distractionWindow.setVisibleOnAllWorkspaces(true);
  distractionWindow.hide();

  if (VITE_DEV_SERVER_URL) {
    distractionWindow.loadURL(url);
    //distractionWindow.webContents.openDevTools();
  } else {
    distractionWindow.loadFile(path.join(process.env.DIST, "distraction.html"));
  }
}

function createWindowMover() {
  let running = false;
  let vector: Vector = { x: 0, y: 0 };
  let speed = 1;
  let lastMousePos = { x: 0, y: 0 };
  let target: Vector | null = null;
  let inactive = 0;
  const delay = 40;

  return {
    stop,
    start,
    accelerate,
    setPosition,
    setVector,
    setSize,
    getInfo,
  };

  function loop() {
    if (!running || !distractionWindow) return;
    if (distractionWindow.isDestroyed()) return;

    const disp = screen.getPrimaryDisplay();
    const [winW, winH] = distractionWindow.getSize();
    const mousePos = screen.getCursorScreenPoint();
    let winPos = getWindowPos();

    if (!Vector.equals(mousePos, lastMousePos)) {
      speed -= 0.1;
      inactive = 0;
    } else {
      speed += 0.1;
      inactive++;
    }
    speed = Math.min(speed, 10);
    speed = Math.max(speed, -0.5);

    if (inactive > 200) {
      const disp = screen.getPrimaryDisplay();
      target = {
        x: Math.random() * disp.size.width,
        y: Math.random() * disp.size.height,
      };
      speed = 0;
      inactive = 0;
    }

    if (target) {
      const v = Vector.sub(target, winPos);
      if (!Vector.equals(mousePos, lastMousePos)) {
        target = null;
      }
      if (Vector.length(v) < 80) {
        speed /= 2;
        target = {
          x: Math.random() * disp.size.width,
          y: Math.random() * disp.size.height,
        };
      }

      vector = Vector.scale(Vector.normalize(v), speed);
      winPos = Vector.add(winPos, vector);
    } else {
      let v = Vector.direction(mousePos, winPos);
      v = Vector.scale(v, speed);
      if (Vector.distance(mousePos, winPos) >= 80) {
        winPos = Vector.add(winPos, v);
      }
      vector = v;

      lastMousePos = mousePos;
    }

    winPos.x = Math.max(winPos.x, -10);
    winPos.x = Math.min(winPos.x, disp.bounds.width - winW);
    winPos.y = Math.max(winPos.y, -10);
    winPos.y = Math.min(winPos.y, disp.bounds.height - winH);

    distractionWindow.setPosition(winPos.x | 0, winPos.y | 0);
    setTimeout(loop, delay);
  }
  function stop() {
    running = false;
  }
  function start() {
    if (!running) {
      running = true;
      loop();
    }
  }
  function accelerate(x: number, y: number) {
    vector = Vector.add(vector, { x, y });
    start();
  }

  function setPosition(x: number, y: number) {
    console.log("setPosition", { x, y });
    vector = { x: 0, y: 0 };
    distractionWindow?.setPosition(x | 0, y | 0);
  }

  function setVector(x: number, y: number) {
    vector = { x, y };
    start();
  }

  function setSize(width: number, height: number) {
    distractionWindow?.setSize(width, height);
  }

  function getInfo() {
    if (distractionWindow?.isDestroyed()) {
      return {
        pos: { x: 0, y: 0 },
        vec: { x: 0, y: 0 },
      };
    }

    const pos = getWindowPos();
    return {
      pos,
      vec: vector,
    };
  }

  function getWindowPos(): Vector {
    if (!distractionWindow || distractionWindow.isDestroyed()) {
      return { x: 0, y: 0 };
    }
    const [x, y] = distractionWindow.getPosition();
    return { x, y };
  }
}
export type WindowMover = ReturnType<typeof createWindowMover>;

export type WindowMoverCommand =
  | { action: "show" }
  | { action: "hide" }
  | { action: "start" }
  | { action: "stop" }
  | { action: "setSize"; args: Parameters<WindowMover["setSize"]> }
  | { action: "accelerate"; args: Parameters<WindowMover["accelerate"]> }
  | { action: "setPosition"; args: Parameters<WindowMover["setPosition"]> }
  | { action: "setVector"; args: Parameters<WindowMover["setVector"]> };
