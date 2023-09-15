import path from "node:path";
import { BrowserWindow, app, screen } from "electron";
import { getPublicPath } from "./api-impl";
import { appEventRegistry } from "../shared/app-event";

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
  distractionWindow.loadURL(url);
  distractionWindow.setSize(200, 200);
  //distractionWindow.webContents.openDevTools({ mode: "detach" });
  distractionWindow.on("close", (e) => {
    e.preventDefault();
    distractionWindow?.hide();
    appEventRegistry.dispatch({ type: "distraction-window-closed" });
  });
  distractionWindow.setSkipTaskbar(true);
  distractionWindow.setVisibleOnAllWorkspaces(true);
  distractionWindow.hide();
}

function createWindowMover() {
  let running = false;
  let [vx, vy] = [0, 0];
  const delay = 40;

  return { stop, start, accelerate, setPosition, setVector, setSize };

  function loop() {
    if (!running || !distractionWindow) return;
    if (distractionWindow.isDestroyed()) return;

    const disp = screen.getPrimaryDisplay();
    const [winW, winH] = distractionWindow.getSize();
    let [x, y] = distractionWindow.getPosition();
    x += vx;
    y += vy;

    x = Math.max(x, -10);
    x = Math.min(x, disp.bounds.width - winW);
    y = Math.max(y, -10);
    y = Math.min(y, disp.bounds.height - winH);

    distractionWindow.setPosition(x | 0, y | 0);
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
    [vx, vy] = [vx + x, vy + y];
    start();
  }

  function setPosition(x: number, y: number) {
    console.log("setPosition", { x, y });
    distractionWindow?.setPosition(x | 0, y | 0);
  }
  function setVector(x: number, y: number) {
    [vx, vy] = [x, y];
    start();
  }

  function setSize(width: number, height: number) {
    distractionWindow?.setSize(width, height);
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
