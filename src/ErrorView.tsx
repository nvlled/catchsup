import { useState } from "react";
import { backupDirName, storageName } from "../shared";
import { Actions } from "./lib/actions";
import { api } from "./lib/api";
import { call } from "./lib/jsext";
import { useOnMount } from "./lib/reactext";

export function ErrorView({ error }: { error: Error }) {
  const [dataDir, setDataDir] = useState("");

  useOnMount(() => {
    call(async () => {
      const dir = await api.withAbsoluteDataDir();
      setDataDir(dir);
    });
  });

  return (
    <div>
      <h1>Oh noes, failed to load your data</h1>
      <br />
      <code>{error.name + ": " + error.message}</code>
      <br />
      <br />
      This could mean that your data is corrupted, or is in invalid format. You
      can do one of the following:
      <ul>
        <li>
          If you know JSON, you can check the file with a notepad and see what's
          wrong.{" "}
        </li>
        <li>
          Restore your data by copying your exported file to the data file. Also
          check the backup folder if there's any previous data file in there.
        </li>
        <li>Data file: {dataDir + "/" + storageName}</li>
        <li>Backup folder: {dataDir + "/" + backupDirName}</li>
      </ul>
    </div>
  );
}
