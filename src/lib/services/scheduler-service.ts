import { DateNumber, UnixTimestamp } from "../../../shared/datetime";
import { Goal, GoalID } from "../../../shared/goal";
import { Scheduler } from "../../../shared/scheduler";
import { Actions } from "../actions";
import { api, events } from "../api";
import { PersistentState, useAppStore } from "../state";
import { Systray } from "../systray";
import {
  CoProcess,
  CoroutineGenerator,
  createProcess,
  sleep,
} from "../coroutine";

export function createSchedulerService() {
  const notifierProc = createProcess(notifier);
  let listenerID = 0;

  return { start, stop };

  function start() {
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;
      if (!Scheduler.hasScheduledGoal(scheduler)) {
        Scheduler.finishNoDisturb(draft.scheduler);
        draft.scheduler.goal = Scheduler.findNextSchedule(
          draft.scheduler,
          draft.goals
        );
      }
      updateSystrayIcon(draft);

      onUpdate();
      draft.scheduler.intervalID = setInterval(onUpdate, 20 * 1000);

      listenerID = events.on((_, e) => {
        switch (e.type) {
          case "settings-updated":
            onSettingsUpdated();
            onUpdate();
            break;
          case "goal-started":
            onGoalStarted(e.id);
            onUpdate();
            break;
          case "goal-finished":
            onGoalFinished(e.id);
            onUpdate();
            break;
          case "goal-modified":
            onGoalModified(e.id);
            onUpdate();
            break;
          case "goal-cancelled":
            onGoalCancelled(e.id);
            onUpdate();
            break;
          case "goal-timeup":
            onGoalTimeUp(e.id);
            onUpdate();
            break;
        }
      });
    });
  }

  function stop() {
    const { scheduler } = useAppStore.getState();
    clearInterval(scheduler.intervalID);
    events.off(listenerID);
    notifierProc.stop();
  }

  function onSettingsUpdated() {
    const state = useAppStore.getState();
    updateSystrayIcon(state);
  }

  function onUpdate() {
    notifierProc.next();

    Actions.produceNextState((draft) => {
      const { goals, scheduler, activeTraining } = draft;

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

      if (scheduler.noDisturb.until && !Scheduler.isNoDisturbMode(scheduler)) {
        Scheduler.finishNoDisturb(scheduler);
        events.dispatch({ type: "no-disturb-change", isOn: false });
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
    // empty
  }

  function onGoalFinished(_goalID: GoalID) {
    Actions.produceNextState((draft) => {
      const { scheduler } = draft;

      scheduler.notificationCount = 0;
      scheduler.lastComplete = UnixTimestamp.current();
      scheduler.lastGoalID = scheduler.goal?.id ?? null;
      scheduler.noDisturb.selections.splice(0);

      scheduler.scheduleInterval = Scheduler.getNextScheduleInterval(
        scheduler,
        draft.goals
      );
      scheduler.goal = Scheduler.findNextSchedule(scheduler, draft.goals);

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

  function* notifier(this: CoProcess): CoroutineGenerator {
    let $ = useAppStore.getState();

    this.create(function* () {
      for (;;) {
        $ = useAppStore.getState();

        if (goalOngoing()) {
          hideShark();
          activeProc.start();
          inactiveProc.pause();

          if ($.activeTraining?.silenceNotification) {
            activeProc.pause();
          } else {
            activeProc.resume();
          }
        } else {
          if (noDisturb() || !canNotify() || !hasScheduled()) {
            hideShark();
            inactiveProc.pause();
          } else {
            inactiveProc.resume();
          }
        }
        yield;
      }
    });

    const listenerID = events.on((_, e) => {
      switch (e.type) {
        case "goal-started":
          hideShark();
          activeProc.restart();
          inactiveProc.pause();
          break;
        case "goal-cancelled":
          activeProc.stop();
          inactiveProc.resume();
          break;
        case "goal-finished":
          activeProc.stop();
          inactiveProc.restart();
          break;
      }
    });

    this.defer(() => events.off(listenerID));

    const activeProc = this.create(function* () {
      while (!$.activeTraining?.timeUp) {
        yield;
      }

      if (!cooldownOver()) {
        Actions.playShortRewardSound(0.85);
        notifyStop();

        while (!cooldownOver()) {
          yield;
        }
      }

      Systray.setIcon("time-up");

      for (;;) {
        notifyStop();
        yield* sleep(30 + Math.random() * 30);

        for (let i = 10; i > 1; i--) {
          notifyStop();
          if (i % 2 === 0) Actions.playShortRewardSound(1 / (i / 2));
          yield* sleep(10 + i);
        }

        yield;
      }
    });

    const inactiveProc = this.create(function* () {
      if ($.scheduler.notificationCount === 0) {
        yield* sleep(15 * 60);
        notifyStart();
        Actions.playShortPromptSound(0.5);
      } else {
        notifyStart();
      }

      while ($.scheduler.notificationCount < 30) {
        console.log("notification count", $.scheduler.notificationCount);
        yield* sleep(60 + Math.random() * 5 * 60);
        if (Math.random() < 0.2) {
          Actions.playShortPromptSound(0.75);
        }
        notifyStart();
      }

      for (;;) {
        yield* sleep(5 * 60);
        notifyStart();
        showShark({ size: 90, seconds: 30 });

        yield* sleep(4 * 60);
        notifyStart();

        yield* sleep(3 * 60);
        notifyStart();
        Actions.playShortPromptSound(0.85);

        yield* sleep(2 * 60);
        notifyStart();

        yield* sleep(1 * 60);
        notifyStart();
        showShark({ size: 200 });

        for (let i = 0; i < 20; i++) {
          yield* sleep(30 + Math.random() * 60);
          notifyStart();
          if (i % 2 !== 1) Actions.playShortPromptSound(1);

          yield* sleep(30 + Math.random() * 60);
          notifyStart();
          showShark({ size: 250 + i * 3 });
        }

        Actions.playShortPromptSound(1);
      }
    });

    activeProc.id = "*active";
    inactiveProc.id = "*inactive";

    activeProc.stop();
    inactiveProc.start();

    for (;;) yield;

    // -----------------

    function goalOngoing() {
      return !!$.activeTraining?.startTime;
    }

    function canNotify() {
      return (
        !$.window.focused &&
        !$.screen.locked &&
        !$.screen.suspended &&
        !$.activeTraining?.startTime &&
        !Scheduler.isNoDisturbMode($.scheduler) &&
        $.lastCompleted != DateNumber.current()
      );
    }

    function hasScheduled() {
      return Scheduler.hasScheduledGoal($.scheduler);
    }
    function noDisturb() {
      return Scheduler.isNoDisturbMode($.scheduler);
    }

    function showShark({
      size = 80,
      seconds = 60,
    }: { size?: number; seconds?: number } = {}) {
      events.dispatch({ type: "start-distraction", seconds, size });
    }
    function hideShark() {
      events.dispatch({ type: "stop-distraction" });
    }

    function notifyStart() {
      const goal = $.goals.find((g) => g.id === $.scheduler.goal?.id);
      if (goal) {
        api.setWindowTitle(goal.title);
        api.showNotification(goal.title, goal.desc.slice(0, 200) ?? "hey");
        api.requestWindowAttention(true);
      }
      Actions.produceNextState((state) => {
        Scheduler.updateNotificationData(state.scheduler);
      });
    }
    function notifyStop() {
      api.showNotification("time's up", "stop now");
      api.requestWindowAttention(true);
      api.setWindowTitle("time's up");
      Actions.produceNextState((state) => {
        Scheduler.updateNotificationData(state.scheduler);
      });
    }
    function cooldownOver() {
      if (!$.activeTraining) return true;
      const elapsed = UnixTimestamp.since($.activeTraining.timeUp);
      return elapsed / 60 > ($.activeTraining.cooldownDuration ?? 5);
    }
  }
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
