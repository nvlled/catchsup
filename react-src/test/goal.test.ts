import { assert, assertType, describe, it } from "vitest";
import { Goal } from "../src/lib/goal";
import {
  DateNumber,
  TimeNumber,
  UnixTimestamp,
  Week,
} from "../src/lib/datetime";

const day1 = 20230101 as DateNumber;
const day2 = 20230102 as DateNumber;
const day3 = 20230103 as DateNumber;
const day4 = 20230104 as DateNumber;
const day5 = 20230105 as DateNumber;
const day6 = 20230106 as DateNumber;
const day7 = 20230107 as DateNumber;

describe("Goal", () => {
  it("has correct weekday", () => {
    assert.equal(Week.fromDateNumber(day1), "sunday");
    assert.equal(Week.fromDateNumber(day2), "monday");
    assert.equal(Week.fromDateNumber(day3), "tuesday");
    assert.equal(Week.fromDateNumber(day4), "wednesday");
    assert.equal(Week.fromDateNumber(day5), "thursday");
  });

  it("schedules by weekdays", () => {
    const goal: Goal = Goal.createEmpty();

    const {
      schedulingData: { weekly },
    } = goal;

    goal.updatedTime = makeTime(day1, 900);
    goal.trainingTime = "morning";
    goal.schedulingType = "weekly";
    weekly.dayOfWeeks = ["monday", "tuesday", "friday"];

    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day1, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day2, 910)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day3, 910)));
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day4, 910)));
  });

  it("schedules by date", () => {
    const goal: Goal = Goal.createEmpty();

    const {
      schedulingData: { monthly },
    } = goal;

    goal.updatedTime = makeTime(day1, 900);
    goal.trainingTime = "morning";
    goal.schedulingType = "monthly";
    monthly.dayOfMonths = [1, 2, 3, 4, 10];

    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day1, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day2, 910)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day3, 910)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day4, 910)));
    assert.isTrue(
      Goal.isDueOnTime(goal, makeTime(DateNumber.addDays(day1, 9), 910))
    );
    assert.isFalse(
      Goal.isDueOnTime(goal, makeTime(DateNumber.addDays(day1, 20), 910))
    );
    assert.isTrue(
      Goal.isDueOnTime(goal, makeTime(DateNumber.addDays(day1, 31), 910))
    );
  });

  it("schedules daily", () => {
    const goal: Goal = Goal.createEmpty();

    const {
      schedulingData: { daily },
    } = goal;

    goal.updatedTime = makeTime(day1, 900);

    goal.trainingTime = 930 as TimeNumber;
    goal.schedulingType = "daily";
    daily.interval = 1;

    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day1, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day2, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day3, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day4, 935)));
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day2, 1030)));
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day2, 900)));

    daily.interval = 2;
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day2, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day3, 930)));

    daily.interval = 2;
    goal.updatedTime = makeTime(day1, 2359);
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day1, 930)));
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day2, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day3, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day4, 930)));

    goal.trainingTime = "morning";

    daily.interval = 1;
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day1, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day2, 930)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day2, 1100)));
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day2, 1159)));
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day2, 500)));
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day2, 1230)));
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day2, 1300)));

    goal.trainingTime = "afternoon";
    assert.isTrue(Goal.isDueOnTime(goal, makeTime(day2, 1200)));
    assert.isFalse(Goal.isDueOnTime(goal, makeTime(day2, 930)));
  });

  it("countDueDaysInBetween", () => {
    const goal: Goal = Goal.createEmpty();
    const {
      schedulingData: { daily, weekly, monthly },
    } = goal;

    goal.schedulingType = "weekly";
    weekly.dayOfWeeks = ["monday", "tuesday", "thursday", "friday"];

    assert.equal(Goal.countDueDays(goal, day1, day2), 1);
    assert.equal(Goal.countDueDays(goal, day2, day5), 3);

    goal.schedulingType = "monthly";
    monthly.dayOfMonths = [1, 3, 5];

    assert.equal(Goal.countDueDays(goal, day1, day2), 1);
    assert.equal(Goal.countDueDays(goal, day2, day5), 2);
    assert.equal(Goal.countDueDays(goal, day1, day5), 3);

    goal.schedulingType = "daily";
    goal.lastSkipCheck = DateNumber.addDays(day1, -10);

    daily.interval = 1;
    assert.equal(Goal.countDueDays(goal, day1, day5), 5);
    assert.equal(Goal.countDueDays(goal, day2, day5), 4);
    assert.equal(Goal.countDueDays(goal, day1, day3), 3);

    daily.interval = 2;
    assert.equal(Goal.countDueDays(goal, day1, day5), 3);
    assert.equal(Goal.countDueDays(goal, day2, day5), 2);
    assert.equal(Goal.countDueDays(goal, day3, day5), 2);
    assert.equal(Goal.countDueDays(goal, day4, day5), 1);
    assert.equal(Goal.countDueDays(goal, day1, day7), 4);

    daily.interval = 3;
    assert.equal(Goal.countDueDays(goal, day1, day5), 2);
    assert.equal(Goal.countDueDays(goal, day1, day4), 2);
    assert.equal(Goal.countDueDays(goal, day1, day3), 1);
  });

  it("adjustDuration", () => {
    const goal: Goal = Goal.createEmpty();
    goal.trainingDuration = 10;
    goal.durationOptions.autoAdjust = true;
    goal.durationOptions.durationRange = { min: 15, max: 30 };
    goal.durationOptions.scale = 1;

    Goal.adjustDuration(goal, -5);
    assert.equal(goal.trainingDuration, 15);

    goal.trainingDuration = 20;
    Goal.adjustDuration(goal, -1);
    assert.equal(goal.trainingDuration, 19);
    Goal.adjustDuration(goal, -1);
    assert.equal(goal.trainingDuration, 18);
    Goal.adjustDuration(goal, -4);
    assert.equal(goal.trainingDuration, 15);
    Goal.adjustDuration(goal, 15);
    assert.equal(goal.trainingDuration, 30);
    Goal.adjustDuration(goal, 100);
    assert.equal(goal.trainingDuration, 30);

    goal.trainingDuration = 20;
    goal.durationOptions.scale = 2;
    Goal.adjustDuration(goal, -1);
    assert.equal(goal.trainingDuration, 18);
    Goal.adjustDuration(goal, 2);
    assert.equal(goal.trainingDuration, 22);
  });

  it("adjustInterval", () => {
    const goal: Goal = Goal.createEmpty();
    const {
      schedulingData: { daily },
    } = goal;
    daily.interval = 1;
    goal.schedulingOptions.daily.autoAdjust = true;
    goal.schedulingOptions.daily.dayIntervalRange = { min: 1, max: 5 };
    goal.schedulingOptions.daily.scale = 1;

    Goal.adjustDailyInterval(goal, 1);
    assert.equal(daily.interval, 2);
    Goal.adjustDailyInterval(goal, 2);
    assert.equal(daily.interval, 4);
    Goal.adjustDailyInterval(goal, 3);
    assert.equal(daily.interval, 5);
    Goal.adjustDailyInterval(goal, -3);
    assert.equal(daily.interval, 2);

    daily.interval = 5;
    goal.schedulingOptions.daily.scale = 2;
    Goal.adjustDailyInterval(goal, -2);
    assert.equal(daily.interval, 1);
    Goal.adjustDailyInterval(goal, 3);
    assert.equal(daily.interval, 5);
  });

  it("deducts daily interval", () => {
    const goal: Goal = Goal.createEmpty();
    const {
      schedulingOptions: { daily: dailyOptions },
      schedulingData: { daily },
    } = goal;

    goal.schedulingType = "daily";
    daily.interval = 3;
    dailyOptions.autoAdjust = true;
    dailyOptions.dayIntervalRange = { min: 1, max: 5 };
    dailyOptions.scale = 1;

    goal.lastSkipCheck = day1;
    Goal.deductSkippedTrainingDays(goal, day2);
    assert.equal(daily.interval, 3);

    goal.lastSkipCheck = day1;
    Goal.deductSkippedTrainingDays(goal, day3);
    assert.equal(daily.interval, 2);
    assert.equal(goal.lastSkipCheck, day2);

    Goal.deductSkippedTrainingDays(goal, day3);
    assert.equal(daily.interval, 2);
    assert.equal(goal.lastSkipCheck, day2);

    daily.interval = 5;
    goal.lastSkipCheck = day1;
    Goal.deductSkippedTrainingDays(goal, day7);
    assert.equal(goal.lastSkipCheck, day6);
    assert.equal(daily.interval, 4);
  });

  it("deducts training duration", () => {
    const goal: Goal = Goal.createEmpty();

    goal.trainingDuration = 30;
    goal.durationOptions.autoAdjust = true;
    goal.durationOptions.durationRange = { min: 15, max: 30 };
    goal.durationOptions.scale = 1;
    goal.schedulingType = "daily";
    goal.schedulingData.daily.interval = 1;

    goal.lastSkipCheck = day1;

    goal.lastSkipCheck = day1;
    Goal.deductSkippedTrainingDays(goal, day1);
    assert.equal(goal.trainingDuration, 30);

    goal.lastSkipCheck = day1;
    Goal.deductSkippedTrainingDays(goal, day5);
    assert.equal(goal.trainingDuration, 27);
    assert.equal(goal.lastSkipCheck, day4);

    goal.trainingDuration = 30;
    goal.lastSkipCheck = day4;
    Goal.deductSkippedTrainingDays(goal, day5);
    assert.equal(goal.lastSkipCheck, day4);
    assert.equal(goal.trainingDuration, 30);

    goal.trainingDuration = 30;
    goal.lastSkipCheck = day4;
    Goal.deductSkippedTrainingDays(goal, day6);
    assert.equal(goal.lastSkipCheck, day5);
    assert.equal(goal.trainingDuration, 29);

    Goal.deductSkippedTrainingDays(goal, day6);
    assert.equal(goal.lastSkipCheck, day5);
    assert.equal(goal.trainingDuration, 29);

    Goal.deductSkippedTrainingDays(goal, day7);
    assert.equal(goal.lastSkipCheck, day6);
    assert.equal(goal.trainingDuration, 28);

    goal.trainingDuration = 30;
    goal.lastSkipCheck = day1;
    goal.durationOptions.autoAdjust = false;
    Goal.deductSkippedTrainingDays(goal, day5);
    assert.equal(goal.lastSkipCheck, day4);
    assert.equal(goal.trainingDuration, 30);

    goal.durationOptions.autoAdjust = true;
    goal.lastSkipCheck = day1;
    Goal.deductSkippedTrainingDays(goal, day5);
    assert.equal(goal.trainingDuration, 27);
  });
});

function makeTime(d: number, t: number) {
  return UnixTimestamp.from(d as DateNumber, t as TimeNumber);
}
