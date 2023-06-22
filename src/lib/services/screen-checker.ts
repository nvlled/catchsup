import { Actions } from "../actions";
import { ElectronEvents } from "../api";

export function createScreenChecker() {
  return { start, stop };

  function start() {
    ElectronEvents.on("lock-screen", onLock);
    ElectronEvents.on("unlock-screen", onUnlock);
    ElectronEvents.on("suspend", onSuspend);
    ElectronEvents.on("resume", onResume);
  }
  function stop() {
    ElectronEvents.off("lock-screen", onLock);
    ElectronEvents.off("unlock-screen", onUnlock);
    ElectronEvents.off("suspend", onSuspend);
    ElectronEvents.off("resume", onResume);
  }
  function onLock() {
    Actions.produceNextState((draft) => {
      draft.screen.locked = true;
    });
  }
  function onUnlock() {
    Actions.produceNextState((draft) => {
      draft.screen.locked = false;
    });
  }
  function onSuspend() {
    Actions.produceNextState((draft) => {
      draft.screen.suspended = true;
    });
  }
  function onResume() {
    Actions.produceNextState((draft) => {
      draft.screen.suspended = false;
    });
  }
}
