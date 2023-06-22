import "./SettingsView.css";

import { useState } from "react";
import { api } from "./lib/api";
import { useOnMount } from "./lib/reactext";
import { call } from "./lib/jsext";
import { storageName } from "../shared";
import { parseState, useAppStore } from "./lib/state";
import { Actions } from "./lib/actions";
import { Space } from "./components";
import { Minutes, UnixTimestamp } from "../shared/datetime";
import { Scheduler } from "../shared/scheduler";

export function SettingsView() {
  const [scheduler] = useAppStore((state) => [state.scheduler]);
  const { options } = scheduler;
  const [noDisturbDuration, setNoDisturbDuration] = useState(16);
  const [dailyLimit, setDailyLimit] = useState(options.dailyLimit);

  const [dataPath, setDataPath] = useState("");
  const now = UnixTimestamp.current();

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
      <div className="no-disturb">
        <h2>Silence</h2>
        {!Scheduler.isNoDisturbMode(scheduler) ? (
          <>
            Do not disturb me for <Space />
            <input
              type="number"
              value={noDisturbDuration}
              min={5}
              max={60}
              onChange={(e) => setNoDisturbDuration(e.target.valueAsNumber)}
            />
            min
            <br />
            <button onClick={handleSubmitNoDisturb}>submit</button>
          </>
        ) : (
          <>
            <em>
              No disturb for{" "}
              {(((scheduler.noDisturbUntil ?? 0) - now) / 60).toFixed(1)}{" "}
              minutes more
            </em>
            <Space />
            <br />
            You will not get any notifications or interruptions until
            <Space />
            {UnixTimestamp.toDate(
              scheduler.noDisturbUntil ?? UnixTimestamp.current()
            )?.toLocaleTimeString()}
            <Space />
            <br />
            <button onClick={Actions.cancelNoDisturb}>cancel</button>
          </>
        )}
      </div>
      <hr />
      <h2>Import/export data</h2>
      Data file path: {dataPath}
      <br />
      <button onClick={handleExport}>export</button>
      <Space />
      <Space />
      <Space />
      <button onClick={handleImport}>import</button>
      <hr />
      <h2>Usage limit</h2>
      Current value: {options.dailyLimit} minutes <br />
      New value
      <Space />
      <input
        size={2}
        type="number"
        value={dailyLimit}
        max={999}
        onChange={(e) =>
          setDailyLimit((e.target.valueAsNumber as Minutes) ?? dailyLimit)
        }
      />
      minutes
      <br />
      <button onClick={handleSubmitDailyLimit}>save</button>
    </div>
  );

  function handleSubmitDailyLimit() {
    Actions.setDailyLimit(dailyLimit);
  }

  function handleSubmitNoDisturb() {
    const now = UnixTimestamp.current();
    const until = (now as number) + noDisturbDuration * 60;
    Actions.setNoDisturb(until as UnixTimestamp);
  }

  async function handleImport() {
    const res = await api.showOpenDialog({
      title: "Select exported file",
    });

    if (!res.canceled && res.filePaths[0]) {
      const filename = res.filePaths[0];
      const destFile = await api.withAbsoluteDataDir(storageName);
      const backupFile = await api.withAbsoluteDataDir(storageName + ".backup");
      const oldData = await api.readFile(destFile);
      const data = await api.readFile(filename);

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
        await api.writeFile(backupFile, oldData);
        await api.writeFile(destFile, data);

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
