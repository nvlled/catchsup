import { partition } from "../src/lib/jsext";
import { DateNumber, TrainingTime, UnixTimestamp } from "./datetime";
import { Goal, GoalDueState, GoalID } from "./goal";

export interface Scheduler {
  goal: {
    id: number;
    scheduledOn: UnixTimestamp;
  } | null;

  intervalID: NodeJS.Timer | undefined;

  dueStates: Record<GoalID, GoalDueState>;

  notifyCounter: number;
  lastComplete: UnixTimestamp | null;
  lastNotify: UnixTimestamp | null;
  lastGoalID: GoalID | null;

  options: {
    maxSessionhours: number;
    scheduleIntervalMinutes: number;
  };
}

export const Scheduler = {
  create(): Scheduler {
    const scheduler: Scheduler = {
      goal: null,

      intervalID: undefined,

      dueStates: {},

      notifyCounter: 0,
      lastGoalID: null,
      lastNotify: null,
      lastComplete: null,

      options: {
        maxSessionhours: 2,
        scheduleIntervalMinutes: 30,
      },
    };
    return scheduler;
  },

  updateDueStates(scheduler: Scheduler, goals: Goal[]) {},

  canScheduleNow(scheduler: Scheduler) {
    const lastGoalWasToday =
      scheduler.goal &&
      UnixTimestamp.toDateNumber(scheduler.goal.scheduledOn) ==
        DateNumber.current();
    const secondsElapsed =
      UnixTimestamp.current() - (scheduler.lastComplete ?? 0);
    const intervalPassed =
      secondsElapsed * 60 >= scheduler.options.scheduleIntervalMinutes;

    return !lastGoalWasToday || intervalPassed;
  },

  canNotifyNow(scheduler: Scheduler): boolean {
    const { goal } = scheduler;
    if (!goal) return false;

    const [min, max] = [20, 15 * 60];
    const h = 60 * 60;
    const elapsed = Math.min(UnixTimestamp.since(goal.scheduledOn), h);
    // Make notifications more frequent as more time elapses
    const interval = min + (1 - elapsed / h) * (max - min);

    if (UnixTimestamp.since(scheduler.lastNotify) < interval) {
      return false;
    }

    return true;
  },

  scheduleNext(scheduler: Scheduler, goals: Goal[]): boolean {
    if (scheduler.goal?.id != null) {
      scheduler.lastGoalID = scheduler.goal.id;
      scheduler.goal = null;
    }

    if (!Scheduler.canScheduleNow(scheduler)) {
      return false;
    }

    const dueGoals = goals.filter(Goal.isDueNow);
    if (dueGoals.length === 0) {
      return false;
    }

    const [fixedTime, anyTime] = partition(
      dueGoals,
      (g) => g.trainingTime !== "auto"
    );

    let goalID: GoalID = 0;
    if (fixedTime.length > 0) {
      fixedTime.sort((a, b) => {
        const durA = TrainingTime.getDuration(a.trainingTime);
        const durB = TrainingTime.getDuration(b.trainingTime);
        return durA - durB;
      });
      goalID = fixedTime[0]?.id ?? null;
    } else {
      anyTime.sort((a, b) => a.updatedTime - b.updatedTime);
      goalID = anyTime[0]?.id ?? null;
    }

    scheduler.goal = {
      id: goalID,
      scheduledOn: UnixTimestamp.current(),
    };

    return true;
  },
};
