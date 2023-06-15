import { AppEvent } from "../app-event";
import { UnixTimestamp } from "../../../shared/datetime";
import { GoalID } from "../../../shared/goal";
import { Scheduler } from "../../../shared/scheduler";
import { Actions } from "../actions";
import { api } from "../api";
import { useAppStore } from "../state";
import { Systray } from "../systray";

export const SchedulerService = {
  start() {
    Actions.produceNextState((draft) => {
      Scheduler.scheduleNext(draft.scheduler, draft.goals);
      draft.scheduler.intervalID = setInterval(
        SchedulerService.onUpdate,
        60 * 1000
      );
      AppEvent.on("goal-started", SchedulerService.onGoalStarted);
      AppEvent.on("goal-finished", SchedulerService.onGoalFinished);
    });
  },
  stop() {
    const { scheduler } = useAppStore.getState();
    clearInterval(scheduler.intervalID);
    AppEvent.on("goal-started", SchedulerService.onGoalStarted);
    AppEvent.on("goal-finished", SchedulerService.onGoalFinished);
  },

  onUpdate() {
    Actions.produceNextState((draft) => {
      if (draft.scheduler.goal?.id != null) {
        const ok = Scheduler.scheduleNext(draft.scheduler, draft.goals);
        Systray.setIcon(ok ? "due-now" : "blank");
      }

      if (
        !draft.window.focused &&
        !draft.screen.locked &&
        !draft.screen.suspended &&
        !draft.activeTraining?.goalID &&
        Scheduler.canNotifyNow(draft.scheduler)
      ) {
        const { scheduler, goals } = draft;
        const goalID = scheduler.goal?.id;
        const goal = goals.find((g) => g.id === goalID);
        if (!goal) {
          api.showNotification("hey", "uh, hello");
        } else {
          api.showNotification(goal.title, goal.desc.slice(0, 100) ?? "hey");
        }
      }
    });
  },

  onGoalStarted(goalID: GoalID) {},

  onGoalFinished(goalID: GoalID) {
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;
      if (scheduler.goal?.id !== goalID) return;

      scheduler.lastComplete = UnixTimestamp.current();
      scheduler.notifyCounter = 0;
      Scheduler.scheduleNext(scheduler, draft.goals);
      Systray.setIcon("blank");
    });
  },
};
