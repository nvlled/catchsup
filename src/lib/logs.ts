import { ForwardSlashPath, logsDirName } from "../../shared";
import { Minutes, UnixTimestamp } from "../../shared/datetime";
import { GoalID } from "../../shared/goal";
import { api } from "./api";

export interface SerializedLog {
  startTime: UnixTimestamp;
  elapsed: Minutes;
  notes?: string | undefined;
}
export interface Log extends SerializedLog {
  goalID: GoalID;
}

export const Logs = {
  async write(goalID: GoalID, logs: Log[]) {
    const filename = await getFilename(goalID);
    const serialLogs: SerializedLog[] = logs.map(
      (l) =>
        ({
          startTime: l.startTime,
          elapsed: l.elapsed,
          notes: l.notes,
        } satisfies SerializedLog)
    );

    await api.atomicWriteFile(filename, JSON.stringify(serialLogs, null, 2));
  },

  async append(newLog: Log) {
    const { goalID } = newLog;
    const [logs, err] = await Logs.read(goalID);
    if (err != null) return [null, err];
    logs.push(newLog);
    return await Logs.write(goalID, logs);
  },

  async update(newLog: Log) {
    const { goalID } = newLog;
    const [logs, err] = await Logs.read(goalID);
    if (err != null) return [null, err];
    const i = logs.findIndex(
      (l) => l.goalID === goalID && l.startTime === newLog.startTime
    );
    if (i >= 0) {
      logs[i] = newLog;
    } else {
      logs.push(newLog);
    }
    return await Logs.write(goalID, logs);
  },

  async read(goalID: GoalID): Promise<[Log[], null] | [null, Error]> {
    const filename = await getFilename(goalID);
    if (!(await api.fileExists(filename))) {
      return [[], null];
    }

    const str = await api.readFile(filename);
    try {
      const obj = JSON.parse(str) ?? [];
      if (validate(obj)) {
        const logs: Log[] = obj.map((o) => {
          const l = o as Log;
          l.goalID = goalID;
          return l;
        });
        return [logs, null];
      }
      return [null, new Error("unrecognized json schema")];
    } catch (e) {
      if (e instanceof Error) {
        return [null, e];
      }
      return [null, new Error("failed to parse json")];
    }
  },

  async readAll(goalIDs: GoalID[]): Promise<[Log[], null] | [null, Error[]]> {
    if (goalIDs.length === 0) return [[], null];

    const errors: Error[] = [];
    const result: Log[] = [];
    for (const id of new Set(goalIDs)) {
      const [logs, err] = await Logs.read(id);
      if (err != null) {
        errors.push(err);
      } else {
        result.push(...logs);
      }
    }
    result.sort((a, b) => a.startTime - b.startTime);

    if (errors.length > 0) return [null, errors];
    return [result, null];
  },
};

function validate(thingy: unknown): thingy is SerializedLog[] {
  if (!thingy) return false;
  if (!Array.isArray(thingy)) return false;

  if (thingy.length === 0) return true;

  const firstElem = thingy[0];
  if (!firstElem) return false;
  if (typeof firstElem !== "object") return false;

  if (!("startTime" in firstElem)) return false;
  if (!("elapsed" in firstElem)) return false;

  return true;
}

async function getFilename(goalID: GoalID) {
  const dir = await api.withAbsoluteDataDir(logsDirName);
  return `${dir}/${goalID}.json` as ForwardSlashPath;
}
