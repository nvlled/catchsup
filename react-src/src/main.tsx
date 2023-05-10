import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { init } from "@neutralinojs/lib";

import "./styles/index.css";
import { enableMapSet } from "immer";

enableMapSet();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

init();
