import { AppEvent } from "../app-event";
import { UnixTimestamp } from "../../../shared/datetime";
import { Goal, GoalID } from "../../../shared/goal";
import { Scheduler } from "../../../shared/scheduler";
import { Actions } from "../actions";
import { api } from "../api";
import { useAppStore } from "../state";
import { Systray } from "../systray";

export const SchedulerService = {
  start() {
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;
      if (!Scheduler.hasScheduledGoal(scheduler)) {
        draft.scheduler.goal = Scheduler.findNextSchedule(
          draft.scheduler,
          draft.goals
        );
      }
      Systray.setIcon(draft.scheduler.goal ? "due-now" : "blank");

      draft.scheduler.intervalID = setInterval(
        SchedulerService.onUpdate,
        10 * 1000
      );
      AppEvent.on("goal-started", SchedulerService.onGoalStarted);
      AppEvent.on("goal-finished", SchedulerService.onGoalFinished);
      AppEvent.on("goal-modified", SchedulerService.onGoalModified);
      AppEvent.on("goal-cancelled", SchedulerService.onGoalCancelled);
      AppEvent.on("goal-timeup", SchedulerService.onGoalTimeUp);
    });
  },
  stop() {
    const { scheduler } = useAppStore.getState();
    clearInterval(scheduler.intervalID);
    AppEvent.off("goal-started", SchedulerService.onGoalStarted);
    AppEvent.off("goal-finished", SchedulerService.onGoalFinished);
    AppEvent.off("goal-modified", SchedulerService.onGoalModified);
    AppEvent.off("goal-cancelled", SchedulerService.onGoalCancelled);
    AppEvent.off("goal-timeup", SchedulerService.onGoalTimeUp);
  },

  onUpdate() {
    Actions.produceNextState((draft) => {
      const { scheduler, window, screen, activeTraining } = draft;
      if (!Scheduler.hasScheduledGoal(scheduler)) {
        scheduler.goal = Scheduler.findNextSchedule(
          draft.scheduler,
          draft.goals
        );
        Systray.setIcon(scheduler.goal ? "due-now" : "blank");
      }

      //console.log(
      //  "scheduler check for notification\n",
      //  "!focused",
      //  !window.focused,
      //  "!locked",
      //  !screen.locked,
      //  "!suspended",
      //  !screen.suspended,
      //  "!activeTraining",
      //  !activeTraining?.startTime,
      //  "has scheduled yet",
      //  Scheduler.hasScheduledGoal(scheduler),
      //  "can notify",
      //  Scheduler.canNotifyStart(scheduler)
      //);

      // notify start
      if (
        !window.focused &&
        !screen.locked &&
        !screen.suspended &&
        !activeTraining?.startTime &&
        Scheduler.hasScheduledGoal(scheduler) &&
        Scheduler.canNotifyStart(scheduler)
      ) {
        const { goals } = draft;
        const goalID = scheduler.goal?.id;
        const goal = goals.find((g) => g.id === goalID);
        if (!goal) {
          console.log("unknown goal ID", goalID);
          api.showNotification("hey", "uh, hello");
        } else {
          scheduler.lastNotify = UnixTimestamp.current();
          api.showNotification(goal.title, goal.desc.slice(0, 100) ?? "hey");
          api.requestWindowAttention(true);
          Actions.playShortPromptSound();
        }
      }

      if (activeTraining?.goalID && activeTraining.timeUp) {
        const elapsed = UnixTimestamp.since(activeTraining.timeUp);
        const cooldownOver =
          elapsed / 60 > (activeTraining.cooldownDuration ?? 2);
        console.log({ elapsed, cooldownOver });

        if (cooldownOver && Scheduler.canNotifyStop(scheduler)) {
          scheduler.lastNotify = UnixTimestamp.current();
          SchedulerService.notifyStop();
        }
      }
    });
  },

  onGoalStarted(_: GoalID) {
    Systray.setIcon("ongoing");
    Actions.produceNextState((draft) => {
      draft.scheduler.lastNotify = UnixTimestamp.current();
    });
  },

  onGoalTimeUp(_: GoalID) {
    SchedulerService.notifyStop();
  },

  onGoalFinished(goalID: GoalID) {
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;
      if (scheduler.goal?.id !== goalID) return;

      scheduler.lastComplete = UnixTimestamp.current();
      scheduler.lastGoalID = scheduler.goal.id;
      scheduler.goal = Scheduler.findNextSchedule(scheduler, draft.goals);
      console.log("goal finished, next goal", scheduler.goal);
      Systray.setIcon(scheduler.goal ? "due-now" : "blank");
    });
  },

  onGoalModified(goalID: GoalID) {
    console.log("goal modified", goalID);
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;
      const goal = draft.goals.find((g) => g.id === goalID);
      const stillDue =
        goal && scheduler.goal?.id === goalID && Goal.isDueNow(goal);

      if (!stillDue || !Scheduler.hasScheduledGoal(scheduler)) {
        scheduler.goal = Scheduler.findNextSchedule(scheduler, draft.goals);
        Systray.setIcon(draft.scheduler.goal ? "due-now" : "blank");
      }
    });
  },

  onGoalCancelled(goalID: GoalID) {
    const { scheduler } = useAppStore.getState();
    if (scheduler.goal?.id === goalID) {
      Systray.setIcon(scheduler.goal ? "due-now" : "blank");
    }
  },

  notifyStop() {
    Systray.setIcon("time-up");
    api.showNotification("time's up", "stop now");
    api.requestWindowAttention(true);
    Actions.playShortRewardSound();
  },
};
