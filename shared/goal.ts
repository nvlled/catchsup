import { assertUnreachable } from "./assert";
import {
  TrainingTime,
  DateNumber,
  Week,
  UnixTimestamp,
  WeekDay,
  Minutes,
} from "./datetime";

import { Motivator } from "./motivator";

export interface TrainingLog {
  goalID: GoalID;
  startTime: UnixTimestamp;
  elapsed: Minutes;
}

export const TrainingLog = {
  getMinutesToday(logs: TrainingLog[]) {
    const today = DateNumber.current();
    return logs
      .filter((l) => UnixTimestamp.toDateNumber(l.startTime) === today)
      .reduce(
        (totalMinutes: number, log: TrainingLog) => totalMinutes + log.elapsed,
        0
      );
  },
  getHoursToday(logs: TrainingLog[]) {
    return TrainingLog.getMinutesToday(logs) / 60;
  },
};

export type ActiveTraining = {
  goalID: GoalID;
  startTime?: UnixTimestamp;
  timeUp?: UnixTimestamp;
  cooldownDuration?: number;
  silenceNotification?: boolean;
} | null;

export type GoalID = number;

export const dueStates = [
  "due-now",
  "due-later",
  "was-due",
  "free",
  "available",
] as const;
export type GoalDueState = (typeof dueStates)[number];

export const goalDueStateImages: Record<GoalDueState, string> = {
  "due-now": "icons/due-now.png",
  available: "icons/due-now.png",
  "due-later": "icons/due-later.png",
  "was-due": "icons/was-due.png",
  free: "",
};

export type SchedulingType = "daily" | "weekly" | "monthly" | "disabled";

export type SetOfWeekDays = Record<WeekDay, boolean>;
export type SetOfDates = Record<number, boolean>;

export interface Goal {
  id: GoalID;
  title: string;
  desc: string;

  oneTime: boolean | null;

  createdTime: UnixTimestamp;
  updatedTime: UnixTimestamp;
  lastSkipCheck: DateNumber;

  trainingTime: TrainingTime;
  resched?: {
    trainingTime: TrainingTime;
    date: DateNumber;
  };

  trainingDuration: Minutes;
  overtime: number | undefined;

  durationOptions: {
    autoAdjust: boolean;

    durationRange: {
      min: number;
      max: number;
    };

    scale: number;
  };

  schedulingType: SchedulingType;
  schedulingData: {
    daily: {
      interval: number;
      dueCount: number | null;
    };
    weekly: {
      dayOfWeeks: SetOfWeekDays;
    };
    monthly: {
      dayOfMonths: SetOfDates;
    };
  };
  schedulingOptions: {
    daily: {
      autoAdjust: boolean;
      scale: number;

      dayIntervalRange: {
        min: number;
        max: number;
      };
      maxDueCount: number | null;
    };
  };

  audioFilename: {
    start?: string;
    end?: string;
  };

  motivators: Motivator[];
}

export const Goal = {
  createEmpty(id = 0): Goal {
    return {
      id,
      title: "",
      desc: "",
      oneTime: false,

      createdTime: UnixTimestamp.current(),
      updatedTime: 0 as UnixTimestamp,
      lastSkipCheck: DateNumber.current(),

      trainingTime: "auto",

      trainingDuration: 15 as Minutes,
      overtime: undefined,

      durationOptions: {
        autoAdjust: false,

        durationRange: {
          min: 15,
          max: 30,
        },

        scale: 1,
      },

      schedulingType: "daily",
      schedulingData: {
        daily: {
          interval: 1,
          dueCount: 0,
        },
        weekly: {
          dayOfWeeks: {} as SetOfWeekDays,
        },
        monthly: {
          dayOfMonths: {} as SetOfDates,
        },
      },
      schedulingOptions: {
        daily: {
          autoAdjust: false,
          scale: 1,

          dayIntervalRange: {
            min: 1,
            max: 5,
          },
          maxDueCount: 0,
        },
      },

      audioFilename: {},

      motivators: [],
    };
  },

  recordTraining(goal: Goal) {
    Goal.adjustDuration(goal, 1);
    Goal.adjustDailyInterval(goal, 1);
    goal.updatedTime = UnixTimestamp.current();
    goal.lastSkipCheck = DateNumber.current();
  },

  adjustDuration(goal: Goal, reps: number) {
    let duration = goal.trainingDuration;
    const { autoAdjust, durationRange: range, scale } = goal.durationOptions;
    if (!autoAdjust) return;

    duration = (duration + reps * scale) as Minutes;
    duration = Math.max(duration, range.min) as Minutes;
    duration = Math.min(duration, range.max) as Minutes;

    goal.trainingDuration = duration;
  },

  adjustDailyInterval(goal: Goal, reps: number) {
    const {
      schedulingData: { daily },
      schedulingOptions: { daily: dailyOptions },
    } = goal;

    if (goal.schedulingType !== "daily") return;
    if (!dailyOptions.autoAdjust) return;

    const { scale, dayIntervalRange } = dailyOptions;
    let dayInterval = daily.interval;

    dayInterval += reps * scale;
    dayInterval = Math.max(dayInterval, dayIntervalRange.min);
    dayInterval = Math.min(dayInterval, dayIntervalRange.max);

    goal.schedulingData.daily.interval = dayInterval;
  },

  deductSkippedTrainingDays(goal: Goal, until?: DateNumber) {
    until ??= DateNumber.current();
    if (goal.lastSkipCheck >= until) {
      return;
    }

    const from = DateNumber.addDays(goal.lastSkipCheck, +1);
    const to = DateNumber.addDays(until, -1);
    const skippedDays = Goal.countDueDays(goal, from, to);

    Goal.adjustDuration(goal, -skippedDays);
    Goal.adjustDailyInterval(goal, -skippedDays);
    goal.lastSkipCheck = to;
  },

  countDueDays(goal: Goal, from: DateNumber, to?: DateNumber) {
    to ??= DateNumber.current();

    if (from > to) return 0;
    if (from == to) return 1;

    switch (goal.schedulingType) {
      case "weekly": {
        const numDays = to - from + 1;
        const weekdays = goal.schedulingData.weekly.dayOfWeeks;
        const date = DateNumber.toDate(from);
        let numDue = 0;

        for (let day = 0; day < numDays; day++) {
          const w = Week.fromDate(date);
          if (weekdays[w]) {
            numDue++;
          }
          date.setDate(date.getDate() + 1);
        }

        return numDue;
      }

      case "monthly": {
        const numDays = to - from + 1;
        const date = DateNumber.toDate(from);
        const { dayOfMonths } = goal.schedulingData.monthly;
        let numDue = 0;

        for (let day = 0; day < numDays; day++) {
          if (dayOfMonths[date.getDate()]) {
            numDue++;
          }
          date.setDate(date.getDate() + 1);
        }

        return numDue;
      }

      case "daily": {
        const { interval } = goal.schedulingData.daily;
        const numDays = to - from + 1;
        return Math.ceil(numDays / interval);
      }

      case "disabled": {
        return 0;
      }

      default:
        assertUnreachable(goal.schedulingType);
    }
  },

  getLastDueDate(goal: Goal): DateNumber | null {
    switch (goal.schedulingType) {
      case "weekly": {
        const weekdays = goal.schedulingData.weekly.dayOfWeeks;
        const date = DateNumber.toDate(DateNumber.current());

        for (let n = 0; n <= 7; n++) {
          const w = Week.fromDate(date);
          if (weekdays[w]) {
            return DateNumber.fromDate(date);
          }
          date.setDate(date.getDate() - 1);
        }

        return null;
      }

      case "monthly": {
        const days = goal.schedulingData.monthly.dayOfMonths;
        const date = DateNumber.toDate(DateNumber.current());

        for (let n = 0; n <= 31; n++) {
          if (days[date.getDate()]) {
            return DateNumber.fromDate(date);
          }
          date.setDate(date.getDate() - 1);
        }

        return null;
      }

      case "daily": {
        const today = DateNumber.current();
        const lastUpdate = UnixTimestamp.toDateNumber(goal.updatedTime);

        const { interval } = goal.schedulingData.daily;
        if (lastUpdate >= today) {
          return today;
        }

        return (today - interval) as DateNumber;
      }
      case "disabled": {
        return null;
      }

      default:
        assertUnreachable(goal.schedulingType);
    }
  },

  isTrainingDone(goal: Goal, training: ActiveTraining, now?: UnixTimestamp) {
    if (!training || !training.startTime) return false;

    const { startTime } = training;
    now ??= UnixTimestamp.current();
    const elapsedMin = (now - startTime) / 60;
    return elapsedMin >= goal.trainingDuration;
  },

  isDueOnDay(goal: Goal, time: UnixTimestamp) {
    if (
      UnixTimestamp.toDateNumber(goal.updatedTime) ==
      UnixTimestamp.toDateNumber(time)
    ) {
      return false;
    }

    switch (goal.schedulingType) {
      case "weekly": {
        const weekdays = goal.schedulingData.weekly.dayOfWeeks;
        const w = Week.fromUnixTimestamp(time);

        if (!w) return false;
        return weekdays[w];
      }
      case "monthly": {
        const days = goal.schedulingData.monthly.dayOfMonths;
        return days[UnixTimestamp.toDate(time).getDate()];
      }
      case "daily": {
        const d = UnixTimestamp.toDateNumber(time);
        const lastUpdate = UnixTimestamp.toDateNumber(goal.updatedTime);

        const { interval: dayInterval } = goal.schedulingData.daily;
        return d - lastUpdate >= dayInterval;
      }
      case "disabled": {
        return false;
      }

      default:
        assertUnreachable(goal.schedulingType);
    }
  },

  isDueOnTime(goal: Goal, time: UnixTimestamp) {
    if (!Goal.isDueOnDay(goal, time)) {
      return false;
    }

    const trainingTime = Goal.getTrainingTime(goal);
    return TrainingTime.inRange(trainingTime, time);
  },

  isDueToday(goal: Goal) {
    return Goal.isDueOnDay(goal, UnixTimestamp.current());
  },

  isDueNow(goal: Goal) {
    const now = UnixTimestamp.current();
    if (!Goal.isDueOnDay(goal, now)) {
      return false;
    }

    const trainingTime = Goal.getTrainingTime(goal);
    return TrainingTime.inRange(trainingTime, now);
  },

  isDue(goal: Goal) {
    const state = Goal.checkDue(goal);
    return state === "due-now" || state === "was-due";
  },

  getTrainingTime(goal: Goal) {
    const today = DateNumber.current();
    if (!goal.resched || goal.resched.date !== today) {
      return goal.trainingTime;
    }
    return goal.resched.trainingTime;
  },

  checkDue(goal: Goal): GoalDueState {
    const now = UnixTimestamp.current();
    if (!Goal.isDueOnDay(goal, now)) {
      return "free";
    }

    if (goal.trainingTime === "auto") {
      return "available";
    }

    const trainingTime = Goal.getTrainingTime(goal);
    if (TrainingTime.inRange(trainingTime, now)) {
      return "due-now";
    }

    const [startTime, endTime] = TrainingTime.getTimeRange(trainingTime);
    const startTimestamp = UnixTimestamp.from(DateNumber.current(), startTime);
    const endTimestamp = UnixTimestamp.from(DateNumber.current(), endTime);
    if (now < endTimestamp || now < startTimestamp) {
      return "due-later";
    }

    return "was-due";
  },

  getDueStates(goals: Goal[]): Record<GoalID, GoalDueState> {
    const result: Record<GoalID, GoalDueState> = {};
    for (const goal of goals) {
      result[goal.id] = Goal.checkDue(goal);
    }
    return result;
  },

  checkAllDue(goals: Goal[]): GoalDueState {
    const set = new Set<GoalDueState>();
    for (const goal of goals) {
      const state = Goal.checkDue(goal);
      set.add(state);
      if (set.size === dueStates.length) {
        break;
      }
    }
    if (set.has("due-now")) return "due-now";
    if (set.has("was-due")) return "was-due";
    if (set.has("due-later")) return "due-later";
    return "free";
  },

  getScheduleSummary(goal: Goal) {
    const data = goal.schedulingData;
    switch (goal.schedulingType) {
      case "daily": {
        return data.daily.interval === 1
          ? "everyday"
          : `every ${data.daily.interval} days`;
      }
      case "weekly": {
        const days: string[] = [];
        for (const [day, ok] of Object.entries(data.weekly.dayOfWeeks)) {
          if (ok) days.push(day);
        }
        return days.join(", ");
      }
      case "monthly": {
        const days: string[] = [];
        for (const [day, ok] of Object.entries(data.monthly.dayOfMonths)) {
          if (ok) days.push(day);
        }
        return "month dates: [" + days.join("|") + "]";
      }
      case "disabled":
        return "not active";
    }
  },
};

export function createExampleGoals(nextID: GoalID): Goal[] {
  return [
    {
      ...Goal.createEmpty(nextID++),
      title: "Read a book",
      desc: `
Edit this and put any book that you are curious about!

If your attention span is all messed up like me,
reading a book will be very difficult 
since you are likely used to endlessly scrolling
on the internet on your spare time.

But do try reading a book 15 minutes a day anyway.
It worked for me.
      `,
    },

    {
      ...Goal.createEmpty(nextID++),
      title: "Meditate",
      desc: `
Rules:
- do nothing, close your eyes or distantly stare at something
- listening to slow or relaxing music is fine, lo-fi works too
- no listening to podcast or any kind of radio talk
- no talking, reading, watching, eating, or sleeping
- avoid moving too much, be still
- avoid shifting your eyes around too much
- relax muscles
- do not look at the time
      `,
    },

    {
      ...Goal.createEmpty(nextID++),
      title: "Learn to draw",
      desc: `
1. Find any book or videos to learn from or follow
2. Practice drawing 
      `,
    },
  ];
}
