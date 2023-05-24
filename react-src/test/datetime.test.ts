import { assert, describe, it } from "vitest";
import {
  DateNumber,
  TimeNumber,
  TimeRange,
  TrainingTime,
  UnixTimestamp,
  Week,
} from "../src/lib/datetime";

describe("TrainingTime", () => {
  it("getTimeRange", () => {
    assert.deepEqual(
      TrainingTime.getTimeRange(1200 as TimeNumber),
      [1200, 1200]
    );

    assert.deepEqual(TrainingTime.getTimeRange("early morning"), [600, 900]);
    assert.deepEqual(
      TrainingTime.getTimeRange("early afternoon"),
      [1200, 1500]
    );

    assert.deepEqual(
      TrainingTime.getTimeRange([1100, 1400] as TimeRange),
      [1100, 1400]
    );
  });

  it("inRange", () => {
    const makeTime = (t: number) => {
      const [hours, minutes] = [Math.floor(t / 100), t % 100];
      return UnixTimestamp.fromDate(new Date(2023, 1, 1, hours, minutes, 0));
    };

    assert.isTrue(TrainingTime.inRange([600, 700] as TimeRange, makeTime(600)));
    assert.isTrue(TrainingTime.inRange([600, 700] as TimeRange, makeTime(700)));
    assert.isTrue(TrainingTime.inRange([600, 700] as TimeRange, makeTime(630)));

    assert.isFalse(
      TrainingTime.inRange([600, 700] as TimeRange, makeTime(500))
    );
    assert.isFalse(
      TrainingTime.inRange([600, 700] as TimeRange, makeTime(559))
    );

    assert.isTrue(
      TrainingTime.inRange([2200, 200] as TimeRange, makeTime(100))
    );
    assert.isTrue(
      TrainingTime.inRange([2200, 200] as TimeRange, makeTime(2200))
    );
    assert.isTrue(
      TrainingTime.inRange([2200, 200] as TimeRange, makeTime(200))
    );

    assert.isFalse(
      TrainingTime.inRange([2200, 200] as TimeRange, makeTime(300))
    );
    assert.isFalse(
      TrainingTime.inRange([2200, 600] as TimeRange, makeTime(610))
    );
    assert.isFalse(
      TrainingTime.inRange([0, 2300] as TimeRange, makeTime(2330))
    );

    assert.isTrue(TrainingTime.inRange([600, 700] as TimeRange, makeTime(705)));
  });
});

describe("DateNumber", () => {
  it("addDays", () => {
    assert.equal(DateNumber.addDays(20230101 as DateNumber, 1), 20230102);
    assert.equal(DateNumber.addDays(20230101 as DateNumber, 0), 20230101);
    assert.equal(DateNumber.addDays(20230101 as DateNumber, 10), 20230111);
    assert.equal(DateNumber.addDays(20230129 as DateNumber, 0), 20230129);
    assert.equal(DateNumber.addDays(20230129 as DateNumber, 2), 20230131);
    assert.equal(DateNumber.addDays(20230129 as DateNumber, 3), 20230201);
    assert.equal(DateNumber.addDays(20221231 as DateNumber, 1), 20230101);

    assert.equal(DateNumber.addDays(20230201 as DateNumber, -1), 20230131);
    assert.equal(DateNumber.addDays(20230201 as DateNumber, -2), 20230130);
    assert.equal(DateNumber.addDays(20230102 as DateNumber, -2), 20221231);
  });
  it("fromDate", () => {
    const date = new Date(2023, 0, 1);
    assert.equal(DateNumber.fromDate(date), 20230101 as DateNumber);
  });
});

describe("Week", () => {
  it("fromDateNumber", () => {
    assert.equal(Week.fromDateNumber(20230501 as DateNumber), "monday");
    assert.equal(Week.fromDateNumber(20230502 as DateNumber), "tuesday");
    assert.equal(Week.fromDateNumber(20230430 as DateNumber), "sunday");
  });
  it("fromUnixTimestamp", () => {
    assert.equal(
      Week.fromUnixTimestamp(1683089734 as UnixTimestamp),
      "wednesday"
    );
  });
});

describe("UnixTimestamp", () => {
  it("toDateNumber", () => {
    assert.equal(
      UnixTimestamp.toDateNumber(1683089734 as UnixTimestamp),
      20230503
    );
  });
  it("fromDate", () => {
    const date = new Date();
    assert.equal(
      UnixTimestamp.fromDate(date),
      Math.floor(date.getTime() / 1000)
    );
  });
  it("from", () => {
    let date = new Date();
    date.setSeconds(0);
    date.setMilliseconds(0);
    let t = TimeNumber.fromDate(date);
    let dn = DateNumber.fromDate(date);
    assert.equal(UnixTimestamp.from(dn, t), Math.floor(date.getTime() / 1000));

    date = new Date(2023, 1, 1, 12, 30, 0);
    t = 1230 as TimeNumber;
    dn = DateNumber.fromDate(date);
    assert.equal(UnixTimestamp.from(dn, t), UnixTimestamp.fromDate(date));
  });
});
