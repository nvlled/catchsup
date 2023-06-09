import { useState } from "react";
import { api } from "./lib/api";
import { useOnMount } from "./lib/reactext";
import { call } from "./lib/jsext";
import { storageName } from "../shared";
import { Actions, parseState } from "./lib/state";
import { Space } from "./components";

export function SettingsView() {
  const [dataPath, setDataPath] = useState("");
  useOnMount(() => {
    call(async () => {
      const dataPath = await api.withAbsoluteDataDir(storageName);
      setDataPath(dataPath);
    });
  });

  return (
    <div>
      <div className="flex-right">
        <button onClick={() => Actions.changePage("home")}>back</button>
      </div>
      Data file path: {dataPath}
      <br />
      <button onClick={handleExport}>export</button>
      <Space />
      <Space />
      <Space />
      <button onClick={handleImport}>import</button>
      <hr />
      daily hour limit <input size={2} />
      <Space />
      <button>save</button>
    </div>
  );

  // TODO: move export and import functions here

  async function handleImport() {
    const res = await api.showOpenDialog({
      title: "Select exported file",
    });

    if (!res.canceled && res.filePaths[0]) {
      const filename = res.filePaths[0];
      const destFile = await api.withAbsoluteDataDir(storageName);
      const backupFile = await api.withAbsoluteDataDir(storageName + ".backup");
      const oldData = await api.readFileSync(destFile, "utf-8");
      const data = await api.readFileSync(filename, "utf-8");

      let obj: unknown = undefined;
      let err: unknown | undefined = undefined;
      try {
        obj = JSON.parse(data);
      } catch (e) {
        err = e;
      }

      if (
        !err &&
        obj &&
        typeof obj === "object" &&
        "state" in obj &&
        parseState(obj.state)
      ) {
        await api.writeFileSync(backupFile, oldData);
        await api.writeFileSync(destFile, data);

        console.log(destFile, obj.state);
        console.log(new TextDecoder().decode(await api.readFileSync(destFile)));
        window.location.reload();
      } else {
        api.showErrorBox("failed to import", "Invalid data file: " + err + "");
        console.log(err);
      }
    }
  }

  async function handleExport() {
    const res = await api.showSaveDialog({
      title: "Select file destination",
    });
    if (!res.canceled && res.filePath) {
      api.exportDataTo(res.filePath);
    }
  }
}
