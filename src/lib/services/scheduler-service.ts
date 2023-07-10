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
          api.showNotification(goal.title, goal.desc.slice(0, 200) ?? "hey");
          api.requestWindowAttention(true);
          api.setWindowTitle(goal.title);
          Actions.playShortPromptSound();
        }
      }

      if (
        !activeTraining?.silenceNotification &&
        activeTraining?.startTime &&
        activeTraining.timeUp
      ) {
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
      api.setWindowTitle("");
      updateSystrayIcon(draft);

      scheduler.scheduleInterval = Scheduler.getNextScheduleInterval(
        draft.scheduler,
        draft.goals
      );
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
