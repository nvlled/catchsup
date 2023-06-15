import { Actions } from "../actions";
import { ElectronEvents } from "../api";

export const ScreenChecker = {
  start() {
    ElectronEvents.on("lock-screen", ScreenChecker.onLock);
    ElectronEvents.on("unlock-screen", ScreenChecker.onUnlock);
    ElectronEvents.on("suspend", ScreenChecker.onSuspend);
    ElectronEvents.on("resume", ScreenChecker.onResume);
  },
  stop() {
    ElectronEvents.off("lock-screen", ScreenChecker.onLock);
    ElectronEvents.off("unlock-screen", ScreenChecker.onUnlock);
  },
  onLock() {
    Actions.produceNextState((draft) => {
      draft.screen.locked = true;
    });
  },
  onUnlock() {
    Actions.produceNextState((draft) => {
      draft.screen.locked = false;
    });
  },
  onSuspend() {
    Actions.produceNextState((draft) => {
      draft.screen.suspended = true;
    });
  },
  onResume() {
    Actions.produceNextState((draft) => {
      draft.screen.suspended = false;
    });
  },
};
