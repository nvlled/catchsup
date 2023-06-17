import { partition } from "../src/lib/jsext";
import { DateNumber, TrainingTime, UnixTimestamp } from "./datetime";
import { Goal, GoalID } from "./goal";

export interface ScheduledGoal {
  id: GoalID;
  scheduledOn: UnixTimestamp;
}

export interface Scheduler {
  goal: ScheduledGoal | null;

  intervalID: NodeJS.Timer | undefined;

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

      lastGoalID: null,
      lastNotify: null,
      lastComplete: null,

      options: {
        maxSessionhours: 2,
        scheduleIntervalMinutes: 1,
      },
    };
    return scheduler;
  },

  canScheduleNext(scheduler: Scheduler) {
    const secondsElapsed =
      UnixTimestamp.current() - (scheduler.lastComplete ?? 0);
    const intervalPassed =
      secondsElapsed / 60 >= scheduler.options.scheduleIntervalMinutes;

    return intervalPassed;
  },

  canNotifyStop(scheduler: Scheduler): boolean {
    return UnixTimestamp.since(scheduler.lastNotify) > 7;
  },

  canNotifyStart(scheduler: Scheduler): boolean {
    const [min, max] = [20, 15 * 60];
    const h = 60 * 60;

    const { goal } = scheduler;
    if (!goal) return false;

    const elapsed = Math.min(UnixTimestamp.since(goal.scheduledOn), h);
    // Make notifications more frequent as more time elapses
    const interval = min + (1 - elapsed / h) * (max - min);

    if (UnixTimestamp.since(scheduler.lastNotify) < interval) {
      return false;
    }

    return true;
  },

  hasScheduledGoal(scheduler: Scheduler) {
    return (
      scheduler.goal &&
      UnixTimestamp.toDateNumber(scheduler.goal.scheduledOn) ==
        DateNumber.current()
    );
  },

  findNextSchedule(scheduler: Scheduler, goals: Goal[]): ScheduledGoal | null {
    if (!Scheduler.canScheduleNext(scheduler)) {
      return null;
    }

    const dueGoals = goals.filter(Goal.isDue);
    if (dueGoals.length === 0) {
      return null;
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

    return {
      id: goalID,
      scheduledOn: UnixTimestamp.current(),
    };
  },
};
