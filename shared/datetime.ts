import { padZero } from "../src/lib/jsext";

export type WeekDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type Seconds = number & { __brand: "seconds" };
export type Minutes = number & { __brand: "minutes" };

// format: YYYYMMDD -> 20230102
export type DateNumber = number & { __brand: "date number" };

export const DateNumber = {
  addDays(dn: DateNumber, count: number): DateNumber {
    const date = DateNumber.toDate(dn);
    date.setDate(date.getDate() + count);
    return DateNumber.fromDate(date);
  },

  toDate(date: DateNumber): Date {
    const year = Math.floor(date / 10000);
    const month = Math.floor((date % 10000) / 100);
    const day = Math.floor(date % 100);
    return new Date(year, month - 1, day, 0, 0, 0);
  },

  fromDate(d: Date): DateNumber {
    const num =
      d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return num as DateNumber;
  },

  current(): DateNumber {
    const d = new Date();
    const num =
      d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return num as DateNumber;
  },

  currentString() {
    const d = new Date();
    return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(
      d.getDate()
    )}`;
  },

  sameDay(d1: DateNumber | null | undefined, d2?: DateNumber) {
    if (!d1) return false;
    return d1 === (d2 ?? DateNumber.current());
  },
};

export type UnixTimestamp = number & { __brand: "unix timestamp" };

export const UnixTimestamp = {
  from(d: DateNumber, t: TimeNumber): UnixTimestamp {
    const dn = DateNumber.toDate(d);
    const [hours, minutes] = TimeNumber.deconstruct(t);
    return UnixTimestamp.fromDate(
      new Date(
        dn.getFullYear(),
        dn.getMonth(),
        dn.getDate(),
        hours,
        minutes,
        0,
        0
      )
    );
  },

  fromDate(d: Date): UnixTimestamp {
    return Math.floor(d.getTime() / 1000) as UnixTimestamp;
  },
  toDate(t: UnixTimestamp) {
    return new Date(t * 1000);
  },
  toDateNumber(t: UnixTimestamp) {
    const d = new Date(t * 1000);
    const num =
      d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return num as DateNumber;
  },
  current(): UnixTimestamp {
    return Math.floor(Date.now() / 1000) as UnixTimestamp;
  },

  since(t: UnixTimestamp | null | undefined) {
    if (!t) return Infinity;
    const now = UnixTimestamp.current();
    return now - t;
  },

  sameDay(t1: UnixTimestamp | null | undefined, t2?: UnixTimestamp) {
    if (!t1) return false;
    const now = UnixTimestamp.current();
    const [d1, d2] = [t1, t2 ?? now].map(UnixTimestamp.toDateNumber);
    return d1 === d2;
  },
};

export const Week = {
  toWeekDay(n: number) {
    switch (n) {
      case 0:
        return "sunday";
      case 1:
        return "monday";
      case 2:
        return "tuesday";
      case 3:
        return "wednesday";
      case 4:
        return "thursday";
      case 5:
        return "friday";
      case 6:
        return "saturday";
    }
    return null;
  },

  fromUnixTimestamp(t: UnixTimestamp): WeekDay {
    return Week.fromDate(new Date(t * 1000));
  },

  fromDateNumber(d: DateNumber): WeekDay {
    const w = Week.toWeekDay(DateNumber.toDate(d).getDay());
    if (!w) {
      throw "should not happen";
    }
    return w;
  },

  fromDate(d: Date): WeekDay {
    const w = Week.toWeekDay(d.getDay());
    if (!w) {
      throw "should not happen";
    }
    return w;
  },

  current() {
    return Week.toWeekDay(new Date().getDay());
  },
};

// time number format (includes startTime and endTime):
// 1230 -> 12:00
// 2300 -> 23:00
export type TimeNumber = number & { __brand: "time number" };

export const TimeNumber = {
  construct(hours: number, minutes: number): TimeNumber {
    return (hours * 100 + minutes) as TimeNumber;
  },
  deconstruct(t: TimeNumber): [hours: number, minutes: number] {
    return [Math.floor(t / 100), t % 100];
  },
  fromDate(d: Date): TimeNumber {
    return (d.getHours() * 100 + d.getMinutes()) as TimeNumber;
  },
  current() {
    const d = new Date();
    return (d.getHours() * 100 + d.getMinutes()) as TimeNumber;
  },
  fromString(s: string) {
    const [h, m] = s.split(":").map((s) => parseInt(s, 10));
    return TimeNumber.construct(h, m);
  },
  toString(t: TimeNumber) {
    const [hour, min] = TimeNumber.deconstruct(t);
    return `${hour.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}`;
  },
  addHours(t: TimeNumber, n: number) {
    t = Math.floor(t) as TimeNumber;

    const [hours, minutes] = TimeNumber.deconstruct(t);
    const addMin = Math.trunc((n % 1) * 60);
    const addHours = Math.trunc(n);

    const d = new Date(0, 0, 0, hours + addHours, minutes + addMin);
    return TimeNumber.fromDate(d);
  },

  getMinutes(time: TimeNumber): Minutes {
    const [h, m] = TimeNumber.deconstruct(time);
    return (h * 60 + m) as Minutes;
  },

  getDuration(laterTime: TimeNumber, earlierTime: TimeNumber): Minutes {
    const laterMinutes = TimeNumber.getMinutes(laterTime);
    const earleirMinutes = TimeNumber.getMinutes(earlierTime);
    return (laterMinutes - earleirMinutes) as Minutes;
  },
};

export type TimeRange = [startTime: TimeNumber, endTime: TimeNumber];

export type TimeRangeLabel =
  | "auto"
  | "morning"
  | "afternoon"
  | "early morning"
  | "late morning"
  | "early afternoon"
  | "late afternoon"
  | "early evening"
  | "late evening"
  | "late at night";

export type TrainingTime = TimeNumber | TimeRangeLabel | TimeRange;

export const TrainingTime = {
  getDuration(tt: TrainingTime) {
    const [from, to] = TrainingTime.getTimeRange(tt);
    const fromTime = TimeNumber.deconstruct(from);
    const fromDate = new Date(0, 0, 0, fromTime[0], fromTime[1]);

    const toTime = TimeNumber.deconstruct(to);
    const toDate = new Date(0, 0, 0, toTime[0], toTime[1]);

    const minutes = (toDate.getTime() - fromDate.getTime()) / 1000 / 60;

    if (from > to) {
      return 24 * 60 + minutes;
    }
    return minutes;
  },
  inRange(tt: TrainingTime, t: UnixTimestamp) {
    const [start, e] = TrainingTime.getTimeRange(tt);
    const end = start === e ? TimeNumber.addHours(e, 5 / 60) : e;
    const x = TrainingTime.fromUnixTimestamp(t);

    if (end >= start) {
      return x >= start && x <= end;
    }
    if (x >= start) {
      return x >= start && x <= 2359;
    }
    return x >= 0 && x <= end;
  },

  getTimeRange(tt: TrainingTime): TimeRange {
    if (typeof tt === "number") {
      return [tt, tt];
    } else if (Array.isArray(tt)) {
      return tt;
    } else {
      return TrainingTime.ranges[tt];
    }
  },

  toString(tt: TrainingTime): string {
    if (typeof tt === "number") {
      return TimeNumber.toString(tt);
    } else if (Array.isArray(tt)) {
      return tt.map(TimeNumber.toString).join("-");
    } else {
      return TrainingTime.ranges[tt]?.map(TimeNumber.toString).join("-");
    }
  },

  fromUnixTimestamp(t: UnixTimestamp) {
    const d = new Date(t * 1000);
    return d.getHours() * 100 + d.getMinutes();
  },

  ranges: {
    auto: [0, 2359],
    morning: [600, 1200],
    afternoon: [1200, 1800],
    "early morning": [600, 900],
    "late morning": [900, 1200],
    "early afternoon": [1200, 1500],
    "late afternoon": [1500, 1800],
    "early evening": [1800, 2100],
    "late evening": [2100, 0],
    "late at night": [0, 600],
  } as Record<TimeRangeLabel, TimeRange>,
};
