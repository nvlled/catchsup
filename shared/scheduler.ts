import { sum } from "../src/lib/jsext";
import {
  Minutes,
  Seconds,
  TimeNumber,
  TrainingTime,
  UnixTimestamp,
} from "./datetime";
import { Goal, GoalID } from "./goal";
import { Rules } from "./rules";

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
  notificationCount: number;
  scheduleInterval: Minutes;

  noDisturb: {
    until: UnixTimestamp | null;
    current: number;
    selections: number[];
  };

  options: {
    dailyLimit: Minutes;
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
      notificationCount: 0,
      scheduleInterval: 30 as Minutes,

      noDisturb: { current: 0, until: null, selections: [] },

      options: {
        dailyLimit: Rules.defaults.dailyLimit,
      },
    };
    return scheduler;
  },

  canScheduleNext(scheduler: Scheduler) {
    const secondsElapsed =
      UnixTimestamp.current() - (scheduler.lastComplete ?? 0);
    const intervalPassed = secondsElapsed / 60 >= scheduler.scheduleInterval;

    return intervalPassed;
  },

  canNotifyStop(scheduler: Scheduler): boolean {
    return UnixTimestamp.since(scheduler.lastNotify) > 7;
  },

  getNotifyStartInterval(scheduler: Scheduler): Seconds {
    const [minimum, maximum] = [5 as Seconds, (15 * 60) as Seconds];
    const h = 7;

    const count = scheduler.notificationCount;
    // Make notifications more frequent as more time elapses

    return (minimum + (1 - count / h) * (maximum - minimum)) as Seconds;
  },

  canNotifyStart(scheduler: Scheduler): boolean {
    const interval = Scheduler.getNotifyStartInterval(scheduler);

    const { goal } = scheduler;
    if (!goal) return false;

    if (UnixTimestamp.since(scheduler.lastNotify) < interval) {
      return false;
    }

    return true;
  },

  updateNotificationData(scheduler: Scheduler) {
    scheduler.lastNotify = UnixTimestamp.current();
    scheduler.notificationCount++;
  },

  hasScheduledGoal(scheduler: Scheduler) {
    return scheduler.goal && UnixTimestamp.sameDay(scheduler.goal.scheduledOn);
  },

  findNextSchedule(scheduler: Scheduler, goals: Goal[]): ScheduledGoal | null {
    if (!Scheduler.canScheduleNext(scheduler)) {
      return null;
    }

    const dueNow: Goal[] = [];
    const wasDue: Goal[] = [];
    const auto: Goal[] = [];
    let dueCount = 0;

    for (const g of goals) {
      const s = Goal.checkDue(g);
      if (!["due-now", "was-due", "available"].includes(s)) continue;

      dueCount++;
      (g.trainingTime === "auto"
        ? auto
        : s === "due-now"
        ? dueNow
        : wasDue
      ).push(g);
    }

    if (dueCount === 0) {
      return null;
    }

    let goalID: GoalID = 0;

    if (dueNow.length > 0) {
      dueNow.sort((a, b) => {
        const durA = TrainingTime.getDuration(a.trainingTime);
        const durB = TrainingTime.getDuration(b.trainingTime);
        return durA - durB;
      });
      goalID = dueNow[0]?.id ?? null;
    } else if (wasDue.length > 0) {
      wasDue.sort((a, b) => {
        const [startTimeA] = TrainingTime.getTimeRange(a.trainingTime);
        const [startTimeB] = TrainingTime.getTimeRange(b.trainingTime);
        return startTimeA - startTimeB;
      });
      goalID = wasDue[0]?.id ?? null;
    } else {
      auto.sort((a, b) => a.updatedTime - b.updatedTime);
      goalID = auto[0]?.id ?? null;
    }

    return {
      id: goalID,
      scheduledOn: UnixTimestamp.current(),
    };
  },

  getNextScheduleInterval(scheduler: Scheduler, goals: Goal[]): Minutes {
    const remainingMinutes = TimeNumber.getDuration(
      2200 as TimeNumber,
      TimeNumber.current()
    );
    const dues = goals.filter(Goal.isDueToday);
    const limitPerDay = scheduler.options.dailyLimit;
    const avgDuration = sum(dues.map((g) => g.trainingDuration)) / dues.length;
    const dueCount = limitPerDay / avgDuration;

    return Math.ceil(remainingMinutes / dueCount) as Minutes;
  },

  isNoDisturbMode({ noDisturb }: Scheduler) {
    return (noDisturb.until ?? 0) > UnixTimestamp.current();
  },

  setNoDisturb(scheduler: Scheduler, minutes: number) {
    const time = (UnixTimestamp.current() + minutes * 60) as UnixTimestamp;
    scheduler.noDisturb.until = time;
    scheduler.noDisturb.current = minutes;
  },

  finishNoDisturb(scheduler: Scheduler) {
    const { noDisturb } = scheduler;
    noDisturb.until = null;
    noDisturb.selections.push(noDisturb.current);
    noDisturb.current = 0;
  },
};
