import { DateNumber, UnixTimestamp } from "../../../shared/datetime";
import { Goal } from "../../../shared/goal";
import { Actions } from "../actions";
import { AppEvent } from "../app-event";
import { useAppStore } from "../state";

export function createActiveTrainingChecker() {
  let intervalID: NodeJS.Timer | undefined;

  return { start, stop };

  function start() {
    clearInterval(intervalID);

    const { activeTraining } = useAppStore.getState();
    const expiredTraining =
      UnixTimestamp.toDateNumber(
        activeTraining?.startTime ?? UnixTimestamp.current()
      ) != DateNumber.current();

    if (expiredTraining) {
      Actions.produceNextState((draft) => {
        draft.activeTraining = null;
      });
      return;
    }

    intervalID = setInterval(async () => {
      const { activeTraining, goals, window } = useAppStore.getState();

      if (!activeTraining?.startTime) return;
      if (activeTraining?.timeUp) return;

      const goal = goals.find((g) => g.id === activeTraining.goalID);
      if (!goal) return;

      const elapsedMin =
        (UnixTimestamp.current() - activeTraining.startTime) / 60;
      const overtime = elapsedMin > goal.trainingDuration * 1.75;
      if (window.focused && !overtime) return;

      if (Goal.isTrainingDone(goal, activeTraining)) {
        Actions.goalTimeUp();
        AppEvent.dispatch("goal-timeup", activeTraining.goalID);
      }
    }, 10 * 1000);
  }

  function stop() {
    clearInterval(intervalID);
  }
}
