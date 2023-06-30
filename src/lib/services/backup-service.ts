import { Seconds, UnixTimestamp } from "../../../shared/datetime";
import { Actions } from "../actions";
import { useAppStore } from "../state";

const backupInterval = (6 * 60 * 60) as Seconds;
const checkInterval = 15 * 60 * 1000;

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
      console.log("creating backup", new Date().toLocaleTimeString());
      Actions.createDataBackup();
    }
  }

  function stop() {
    clearInterval(timerID);
  }
}
