import "./styles/index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import { enableMapSet } from "immer";
import { marked } from "marked";

Howler.autoSuspend = false;

enableMapSet();

marked.use({
  silent: true,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");
