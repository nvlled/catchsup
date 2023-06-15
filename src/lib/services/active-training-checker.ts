import { UnixTimestamp } from "../../../shared/datetime";
import { Goal } from "../../../shared/goal";
import { Actions } from "../actions";
import { api } from "../api";
import { useAppStore } from "../state";
import { Systray } from "../systray";

export const ActiveTrainingChecker = {
  intervalID: undefined as NodeJS.Timer | undefined,
  start() {
    clearInterval(ActiveTrainingChecker.intervalID);
    ActiveTrainingChecker.intervalID = setInterval(async () => {
      const { activeTraining, goals, window } = useAppStore.getState();
      if (!activeTraining?.startTime) return;
      if (activeTraining?.silenceNotification) return;

      const goal = goals.find((g) => g.id === activeTraining.goalID);
      if (!goal) return;

      const elapsedMin =
        (UnixTimestamp.current() - activeTraining.startTime) / 60;
      const overtime = elapsedMin > goal.trainingDuration * 1.75;
      if (window.focused && !overtime) return;

      if (!Goal.isTrainingDone(goal, activeTraining)) {
        return;
      }
      Systray.setIcon("time-up");
      api.showNotification("done", goal.title);
      api.requestWindowAttention(true);
      Actions.playShortRewardSound();
    }, 10 * 1000);
  },
  stop() {
    clearInterval(ActiveTrainingChecker.intervalID);
  },
};
