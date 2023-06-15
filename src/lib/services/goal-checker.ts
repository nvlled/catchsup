import { produce } from "immer";
import { UnixTimestamp } from "../../../shared/datetime";
import { Goal, dueStates } from "../../../shared/goal";
import { sleep } from "../../common";
import { api } from "../api";
import { Actions } from "../actions";
import { useAppStore } from "../state";
import { Systray } from "../systray";

export const GoalChecker = {
  secondsFreq: 50,
  intervalID: undefined as NodeJS.Timer | undefined,
  start() {
    clearInterval(GoalChecker.intervalID);
    GoalChecker.intervalID = setInterval(
      GoalChecker.updateDueGoals,
      GoalChecker.secondsFreq * 1000
    );
    GoalChecker.updateDueGoals();
  },

  updateDueGoals() {
    const state = useAppStore.getState();

    const dues: Goal[] = [];
    let hasDueNow = false;
    const updatedDueStates = produce(state.dueStates, (draft) => {
      for (const goal of state.goals) {
        draft[goal.id] = Goal.checkDue(goal);
        const dueState = draft[goal.id];
        hasDueNow ||= dueState === "due-now";
        if (dueState === "due-now" || dueState === "was-due") {
          dues.push(goal);
        }
      }
    });

    useAppStore.setState({
      dueStates: updatedDueStates,
    });

    if (state.activeTraining?.startTime) {
      const { activeTraining } = state;
      const goal = state.goals.find(
        (goal) => goal.id === activeTraining.goalID
      );
      if (goal && Goal.isTrainingDone(goal, state.activeTraining)) {
        Systray.setIcon("time-up");
      } else {
        Systray.setIcon("ongoing");
      }
    } else {
      Systray.setIconByDueState(Goal.checkAllDue(state.goals));
    }

    if (dues.length > 0 && !state.activeTraining?.startTime) {
      api.requestWindowAttention(true);
    }

    const lastNotif = UnixTimestamp.since(state.lastNotification);
    const lastFinish = UnixTimestamp.since(state.lastGoalFinish);
    console.log({ hasDueNow, lastFinish, lastNotif });

    const [notifWait, finishWait] = dues.some(
      (g) => dueStates[g.id] === "due-now"
    )
      ? [5, 30]
      : [10, 40];

    if (
      dues.length > 0 &&
      !state.activeTraining?.startTime &&
      lastNotif > notifWait * 60 &&
      lastFinish > finishWait * 60
    ) {
      const focused = useAppStore.getState().window.focused;
      if (!focused) {
        const text = dues
          .slice(0, 3)
          .map((g) => "- " + g.title.slice(0, 100))
          .join("\n");

        (async function () {
          for (let i = 0; i < 2; i++) {
            const s = useAppStore.getState();
            api.showNotification(i + ": hey, got free time?", text);
            api.requestWindowAttention(true);
            Actions.playShortPromptSound();

            if (s.window.focused || !hasDueNow) {
              break;
            }

            await sleep(5000);
          }

          Actions.produceNextState((draft) => {
            draft.lastNotification = UnixTimestamp.current();
          });
        })();
      }
    }
  },

  stop() {
    clearInterval(GoalChecker.intervalID);
  },
};
