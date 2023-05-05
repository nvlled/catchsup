import { assertUnreachable } from "./asset";
import {
  TrainingTime,
  DateNumber,
  Week,
  UnixTimestamp,
  WeekDay,
} from "./datetime";

import { Motivator } from "./motivator";

export interface TrainingLog {
  goalID: number;
  startTime: number;
  elapsed: number;
  notes?: string;
}

export interface Goal {
  id: number;
  title: string;
  desc: string | null;

  createdTime: UnixTimestamp;
  updatedTime: UnixTimestamp;
  lastSkipCheck: DateNumber;
  //lastConfigEdit: DateNumber;

  trainingTime: TrainingTime;

  trainingDuration: number; // minutes
  durationOptions: {
    autoAdjust: boolean;

    durationRange: {
      min: number;
      max: number;
    };

    scale: number;
  };

  schedulingType: "daily" | "weekly" | "monthly";
  schedulingData: {
    daily: {
      interval: number;
    };
    weekly: {
      dayOfWeeks: WeekDay[];
    };
    monthly: {
      dayOfMonths: number[];
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
    };
  };

  audioFilename: {
    start?: string;
    end?: string;
  };

  motivators: Motivator[];
}

export const Goal = {
  createEmpty(): Goal {
    return {
      id: 0,
      title: "",
      desc: "",

      createdTime: UnixTimestamp.current(),
      updatedTime: UnixTimestamp.current(),
      lastSkipCheck: DateNumber.current(),

      trainingTime: "morning",

      trainingDuration: 15,
      durationOptions: {
        autoAdjust: true,

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
        },
        weekly: {
          dayOfWeeks: [],
        },
        monthly: {
          dayOfMonths: [],
        },
      },
      schedulingOptions: {
        daily: {
          autoAdjust: true,
          scale: 1,

          dayIntervalRange: {
            min: 1,
            max: 5,
          },
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

    duration += reps * scale;
    duration = Math.max(duration, range.min);
    duration = Math.min(duration, range.max);

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
          if (weekdays.includes(w)) {
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
          if (dayOfMonths.includes(date.getDate())) {
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
          if (weekdays.includes(w)) {
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
          if (days.includes(date.getDate())) {
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

      default:
        assertUnreachable(goal.schedulingType);
    }
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
        return weekdays.includes(w);
      }
      case "monthly": {
        const days = goal.schedulingData.monthly.dayOfMonths;
        return days.includes(UnixTimestamp.toDate(time).getDate());
      }
      case "daily": {
        const d = UnixTimestamp.toDateNumber(time);
        const lastUpdate = UnixTimestamp.toDateNumber(goal.updatedTime);

        const { interval: dayInterval } = goal.schedulingData.daily;
        return d - lastUpdate >= dayInterval;
      }

      default:
        assertUnreachable(goal.schedulingType);
    }
  },

  isDueOnTime(goal: Goal, time: UnixTimestamp) {
    if (!Goal.isDueOnDay(goal, time)) {
      return false;
    }

    const trainingTime = goal.trainingTime;
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

    const trainingTime = goal.trainingTime;
    return TrainingTime.inRange(trainingTime, now);
  },
};
