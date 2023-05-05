export type WeekDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

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
  deconstruct(t: TimeNumber): [hours: number, minutes: number] {
    return [Math.floor(t / 100), t % 100];
  },
  fromDate(d: Date): TimeNumber {
    return (d.getHours() * 100 + d.getMinutes()) as TimeNumber;
  },
};

export type TimeRange = [startTime: TimeNumber, endTime: TimeNumber];

export type TimeRangeLabel =
  | "morning"
  | "afternoon"
  | "evening"
  | "late evening"
  | "late at night";

export type TrainingTime = TimeNumber | TimeRangeLabel | TimeRange;

export const TrainingTime = {
  inRange(tt: TrainingTime, t: UnixTimestamp) {
    const [start, end] = TrainingTime.getTimeRange(tt);
    let x = TrainingTime.fromUnixTimestamp(t);

    // ignore minutes in ones
    // example, 12:31 -> 12:30
    //          12:37 -> 12:30
    x = Math.floor(x / 10) * 10;

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

  fromUnixTimestamp(t: UnixTimestamp) {
    const d = new Date(t * 1000);
    return d.getHours() * 100 + d.getMinutes();
  },

  ranges: {
    morning: [600, 1200],
    afternoon: [1200, 1800],
    evening: [1800, 2100],
    "late evening": [2100, 0],
    "late at night": [0, 600],
  } as Record<TimeRangeLabel, TimeRange>,
};
