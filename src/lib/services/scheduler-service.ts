import { AppEvent } from "../app-event";
import { DateNumber, UnixTimestamp } from "../../../shared/datetime";
import { Goal, GoalID } from "../../../shared/goal";
import { Scheduler } from "../../../shared/scheduler";
import { Actions } from "../actions";
import { api } from "../api";
import { PersistentState, useAppStore } from "../state";
import { Systray } from "../systray";

export function createSchedulerService() {
  return { start, stop };

  function start() {
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;
      if (!Scheduler.hasScheduledGoal(scheduler)) {
        draft.scheduler.goal = Scheduler.findNextSchedule(
          draft.scheduler,
          draft.goals
        );
      }
      updateSystrayIcon(draft);

      draft.scheduler.intervalID = setInterval(onUpdate, 10 * 1000);
      AppEvent.on("settings-updated", onSettingsUpdated);
      AppEvent.on("goal-started", onGoalStarted);
      AppEvent.on("goal-finished", onGoalFinished);
      AppEvent.on("goal-modified", onGoalModified);
      AppEvent.on("goal-cancelled", onGoalCancelled);
      AppEvent.on("goal-timeup", onGoalTimeUp);
    });
  }

  function stop() {
    const { scheduler } = useAppStore.getState();
    clearInterval(scheduler.intervalID);
    AppEvent.off("settings-updated", onSettingsUpdated);
    AppEvent.off("goal-started", onGoalStarted);
    AppEvent.off("goal-finished", onGoalFinished);
    AppEvent.off("goal-modified", onGoalModified);
    AppEvent.off("goal-cancelled", onGoalCancelled);
    AppEvent.off("goal-timeup", onGoalTimeUp);
  }

  function onSettingsUpdated() {
    const state = useAppStore.getState();
    updateSystrayIcon(state);
  }

  function onUpdate() {
    Actions.produceNextState((draft) => {
      const { goals, scheduler, activeTraining, window, screen } = draft;

      updateSystrayIcon(draft);

      const hasScheduledGoal = Scheduler.hasScheduledGoal(scheduler);
      let reschedNonAuto = false;
      if (hasScheduledGoal) {
        const goal = goals.find((g) => g.id === scheduler.goal?.id);
        const isAuto = goal?.trainingTime === "auto";
        reschedNonAuto =
          isAuto &&
          goals.some((g) => Goal.isDueNow(g) && g.trainingTime !== "auto");
      }

      if (!activeTraining?.startTime && (!hasScheduledGoal || reschedNonAuto)) {
        scheduler.goal = Scheduler.findNextSchedule(
          draft.scheduler,
          draft.goals
        );
      }

      if (UnixTimestamp.since(scheduler.lastNotify) > 2 * 60) {
        api.requestWindowAttention(false);
      }

      const notify =
        !window.focused &&
        !screen.locked &&
        !screen.suspended &&
        !activeTraining?.startTime &&
        !Scheduler.isNoDisturbMode(scheduler) &&
        draft.lastCompleted != DateNumber.current() &&
        Scheduler.hasScheduledGoal(scheduler);

      if (notify && Scheduler.canNotifyStart(scheduler)) {
        const { goals } = draft;
        const goalID = scheduler.goal?.id;
        const goal = goals.find((g) => g.id === goalID);
        if (!goal) {
          console.log("unknown goal ID", goalID);
          api.showNotification("hey", "uh, hello");
        } else {
          Scheduler.updateNotificationData(scheduler);
          api.showNotification(goal.title, goal.desc.slice(0, 100) ?? "hey");
          api.requestWindowAttention(true);
          api.setWindowTitle(goal.title);
          Actions.playShortPromptSound();
        }
      }

      if (activeTraining?.startTime && activeTraining.timeUp) {
        const elapsed = UnixTimestamp.since(activeTraining.timeUp);
        const cooldownOver =
          elapsed / 60 > (activeTraining.cooldownDuration ?? 5);

        if (cooldownOver && Scheduler.canNotifyStop(scheduler)) {
          Scheduler.updateNotificationData(scheduler);
          notifyStop();
        }
      }
    });
  }

  function onGoalStarted(id: GoalID) {
    Systray.setIcon("ongoing");
    Actions.produceNextState((draft) => {
      Scheduler.updateNotificationData(draft.scheduler);
      api.setWindowTitle(draft.goals.find((g) => g.id === id)?.title);
    });
  }

  function onGoalTimeUp(_: GoalID) {
    notifyStop();
  }

  function onGoalFinished(_goalID: GoalID) {
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;

      scheduler.notificationCount = 0;
      scheduler.lastComplete = UnixTimestamp.current();
      scheduler.lastGoalID = scheduler.goal?.id ?? null;
      scheduler.goal = Scheduler.findNextSchedule(scheduler, draft.goals);
      scheduler.scheduleInterval = Scheduler.getNextScheduleInterval(
        draft.goals
      );
      api.setWindowTitle("");
      updateSystrayIcon(draft);
    });
  }

  function onGoalModified(goalID: GoalID) {
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;
      const goal = draft.goals.find((g) => g.id === goalID);
      const stillDue =
        goal && scheduler.goal?.id === goalID && Goal.isDueNow(goal);

      if (!stillDue || !Scheduler.hasScheduledGoal(scheduler)) {
        scheduler.goal = Scheduler.findNextSchedule(scheduler, draft.goals);
        updateSystrayIcon(draft);
      }
    });
  }

  function onGoalCancelled(goalID: GoalID) {
    const state = useAppStore.getState();
    const { scheduler } = state;
    if (goalID === scheduler?.goal?.id) {
      updateSystrayIcon(state);
    }
  }

  function notifyStop() {
    Systray.setIcon("time-up");
    api.showNotification("time's up", "stop now");
    api.requestWindowAttention(true);
    Actions.playShortRewardSound();
  }

  function updateSystrayIcon(state: PersistentState) {
    const { scheduler, activeTraining, lastCompleted } = state;
    if (activeTraining?.startTime) {
      Systray.setIcon(activeTraining.timeUp ? "time-up" : "ongoing");
    } else {
      const doneForToday = lastCompleted == DateNumber.current();
      Systray.setIcon(
        Scheduler.hasScheduledGoal(scheduler) &&
          !Scheduler.isNoDisturbMode(scheduler) &&
          !doneForToday
          ? "due-now"
          : "blank"
      );
    }
  }
}

/*
export const SchedulerService = {
  start() {
    Actions.produceNextState((draft) => {
      const { scheduler, activeTraining } = draft;
      if (!Scheduler.hasScheduledGoal(scheduler)) {
        draft.scheduler.goal = Scheduler.findNextSchedule(
          draft.scheduler,
          draft.goals
        );
      }
      SchedulerService.updateSystrayIcon(scheduler, activeTraining);

      draft.scheduler.intervalID = setInterval(
        SchedulerService.onUpdate,
        5 * 1000
      );
      AppEvent.on("settings-updated", SchedulerService.onSettingsUpdated);
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
    AppEvent.off("settings-updated", SchedulerService.onSettingsUpdated);
    AppEvent.off("goal-started", SchedulerService.onGoalStarted);
    AppEvent.off("goal-finished", SchedulerService.onGoalFinished);
    AppEvent.off("goal-modified", SchedulerService.onGoalModified);
    AppEvent.off("goal-cancelled", SchedulerService.onGoalCancelled);
    AppEvent.off("goal-timeup", SchedulerService.onGoalTimeUp);
  },

  onSettingsUpdated() {
    const { scheduler, activeTraining } = useAppStore.getState();
    SchedulerService.updateSystrayIcon(scheduler, activeTraining);
  },

  onUpdate() {
    Actions.produceNextState((draft) => {
      const { scheduler, window, screen, activeTraining } = draft;
      if (
        !activeTraining?.startTime &&
        !Scheduler.hasScheduledGoal(scheduler)
      ) {
        scheduler.goal = Scheduler.findNextSchedule(
          draft.scheduler,
          draft.goals
        );
        SchedulerService.updateSystrayIcon(scheduler, activeTraining);
      }

      if (UnixTimestamp.since(scheduler.lastNotify) > 2 * 60) {
        api.requestWindowAttention(false);
      }

      const notify =
        !window.focused &&
        !screen.locked &&
        !screen.suspended &&
        !activeTraining?.startTime &&
        draft.lastCompleted != DateNumber.current() &&
        !Scheduler.isNoDisturbMode(scheduler) &&
        Scheduler.hasScheduledGoal(scheduler);

      if (notify && Scheduler.canNotifyStart(scheduler)) {
        const { goals } = draft;
        const goalID = scheduler.goal?.id;
        const goal = goals.find((g) => g.id === goalID);
        if (!goal) {
          console.log("unknown goal ID", goalID);
          api.showNotification("hey", "uh, hello");
        } else {
          Scheduler.updateNotificationData(scheduler);
          api.showNotification(goal.title, goal.desc.slice(0, 100) ?? "hey");
          api.requestWindowAttention(true);
          api.setWindowTitle(goal.title);
          Actions.playShortPromptSound();
        }
      }

      if (activeTraining?.startTime && activeTraining.timeUp) {
        const elapsed = UnixTimestamp.since(activeTraining.timeUp);
        const cooldownOver =
          elapsed / 60 > (activeTraining.cooldownDuration ?? 5);

        if (cooldownOver && Scheduler.canNotifyStop(scheduler)) {
          Scheduler.updateNotificationData(scheduler);
          SchedulerService.notifyStop();
        }
      }
    });
  },

  onGoalStarted(id: GoalID) {
    Systray.setIcon("ongoing");
    Actions.produceNextState((draft) => {
      Scheduler.updateNotificationData(draft.scheduler);
      api.setWindowTitle(draft.goals.find((g) => g.id === id)?.title);
    });
  },

  onGoalTimeUp(_: GoalID) {
    SchedulerService.notifyStop();
  },

  onGoalFinished(_goalID: GoalID) {
    Actions.produceNextState((draft) => {
      const { scheduler, activeTraining } = draft;

      scheduler.notificationCount = 0;
      scheduler.lastComplete = UnixTimestamp.current();
      scheduler.lastGoalID = scheduler.goal?.id ?? null;
      scheduler.goal = Scheduler.findNextSchedule(scheduler, draft.goals);
      api.setWindowTitle("");
      SchedulerService.updateSystrayIcon(scheduler, activeTraining);
    });
  },

  onGoalModified(goalID: GoalID) {
    Actions.produceNextState((draft) => {
      const { scheduler, activeTraining } = draft;
      const goal = draft.goals.find((g) => g.id === goalID);
      const stillDue =
        goal && scheduler.goal?.id === goalID && Goal.isDueNow(goal);

      if (!stillDue || !Scheduler.hasScheduledGoal(scheduler)) {
        scheduler.goal = Scheduler.findNextSchedule(scheduler, draft.goals);
        SchedulerService.updateSystrayIcon(scheduler, activeTraining);
      }
    });
  },

  onGoalCancelled(_goalID: GoalID) {
    const { scheduler, activeTraining } = useAppStore.getState();
    //if (goalID === scheduler?.goal?.id) {
    SchedulerService.updateSystrayIcon(scheduler, activeTraining);
    //}
  },

  notifyStop() {
    Systray.setIcon("time-up");
    api.showNotification("time's up", "stop now");
    api.requestWindowAttention(true);
    Actions.playShortRewardSound();
  },

  updateSystrayIcon(scheduler: Scheduler, activeTraining: ActiveTraining) {
    if (activeTraining?.startTime) {
      Systray.setIcon(activeTraining.timeUp ? "time-up" : "ongoing");
    } else {
      Systray.setIcon(
        scheduler.goal && !Scheduler.isNoDisturbMode(scheduler)
          ? "due-now"
          : "blank"
      );
    }
  },
};
*/
