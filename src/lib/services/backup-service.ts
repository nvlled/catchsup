import { Hours, Seconds, UnixTimestamp } from "../../../shared/datetime";
import { Actions } from "../actions";
import { useAppStore } from "../state";

const backupInterval = (6 * 60 * 60) as Seconds;
const checkInterval = 15 * 60 * 1000;

const maxBackups = 30;

export function createBackupService() {
  let timerID: NodeJS.Timer | undefined;
  return { start, stop };

  function start() {
    timerID = setInterval(loop, checkInterval);
  }

  function loop() {
    const { backup } = useAppStore.getState();
    const now = UnixTimestamp.current();
    console.log("check for backup", new Date().toLocaleTimeString());
    if (now - (backup.lastBackup ?? -Infinity) >= backupInterval) {
      const nextCounter = (backup.counter + 1) % maxBackups;
      console.log(
        "creating backup",
        nextCounter,
        new Date().toLocaleTimeString()
      );
      Actions.createBackup(nextCounter);
    }
  }

  function stop() {
    clearInterval(timerID);
  }
}
