import "./SettingsView.css";

import { useState } from "react";
import { api } from "./lib/api";
import { useOnMount } from "./lib/reactext";
import { call } from "./lib/jsext";
import { ForwardSlashPath, storageName } from "../shared";
import { parseState, useAppStore } from "./lib/state";
import { Actions } from "./lib/actions";
import { Space } from "./components";
import { Minutes, UnixTimestamp } from "../shared/datetime";
import { Scheduler } from "../shared/scheduler";

export function SettingsView() {
  const [scheduler] = useAppStore((state) => [state.scheduler]);
  const { options } = scheduler;
  const [dailyLimit, setDailyLimit] = useState(options.dailyLimit);

  const [dataPath, setDataPath] = useState("");

  useOnMount(() => {
    call(async () => {
      const dataPath = await api.withAbsoluteDataDir(storageName);
      setDataPath(dataPath);
    });
  });

  const secondsUntilNextNotif =
    Scheduler.getNotifyStartInterval(scheduler) -
    UnixTimestamp.since(scheduler.lastNotify);

  return (
    <div>
      {Number.isFinite(secondsUntilNextNotif) && secondsUntilNextNotif > 0 && (
        <small>
          next notification in {Math.ceil(secondsUntilNextNotif)}secs
        </small>
      )}
      <div className="flex-right">
        <button onClick={() => Actions.changePage("home")}>← back</button>
      </div>
      {/*
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
            <Space count={3} />
            <button onClick={handleSubmitNoDisturb}>submit</button>
          </>
        ) : (
          <>
            <em>
              No disturb for{" "}
              {(((scheduler.noDisturb.until ?? 0) - now) / 60).toFixed(1)}{" "}
              minutes more
            </em>
            <Space />
            <br />
            You will not get any notifications or interruptions until
            <Space />
            {UnixTimestamp.toDate(
              scheduler.noDisturb.until ?? UnixTimestamp.current()
            )?.toLocaleTimeString()}
            <Space />
            <br />
            <button onClick={Actions.cancelNoDisturb}>cancel</button>
          </>
        )}
      </div>
      <hr />
      */}
      <h2>Import/export data</h2>
      Data file path: {dataPath}
      <br />
      <button onClick={handleExportData}>export</button>
      <Space />
      <Space />
      <Space />
      <button onClick={handleImportData}>import</button>
      <Space />
      <Space />
      <Space />
      <button onClick={handleViewData}>view</button>
      <hr />
      <h2>Daily Usage Limit</h2>
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
      <Space count={3} />
      <button onClick={handleSubmitDailyLimit}>submit</button>
    </div>
  );

  function handleSubmitDailyLimit() {
    Actions.setDailyLimit(dailyLimit);
    Actions.changePage("home");
  }

  //function handleSubmitNoDisturb() {
  //  Actions.setNoDisturb(noDisturbDuration);
  //  Actions.changePage("home");
  //}

  async function handleViewData() {
    const dataPath = await api.withAbsoluteDataDir();
    api.showItemInFolder(dataPath);
  }

  async function handleImportData() {
    const res = await api.showOpenDialog({
      title: "Select exported file",
    });

    if (!res.canceled && res.filePaths[0]) {
      const filename = res.filePaths[0];
      const destFile = await api.withAbsoluteDataDir(storageName);
      const backupFile = await api.withAbsoluteDataDir(
        (storageName + ".backup") as ForwardSlashPath
      );
      const oldData = await api.readFile(destFile);
      const data = await api.readFile(await api.toUnixPath(filename));

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

  async function handleExportData() {
    const res = await api.showSaveDialog({
      title: "Select file destination",
    });
    if (!res.canceled && res.filePath) {
      api.exportDataTo(await api.toUnixPath(res.filePath));
    }
  }
}
