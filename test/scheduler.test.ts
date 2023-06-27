import { UnixTimestamp } from "../shared/datetime";
import { Goal, GoalID } from "../shared/goal";
import { Scheduler } from "../shared/scheduler";
import { assert, describe, it } from "vitest";

describe("Scheduler", () => {
  it("canScheduleNow", () => {
    const scheduler = Scheduler.create();
    const now = UnixTimestamp.current();

    scheduler.goal = null;
    assert.isTrue(Scheduler.canScheduleNext(scheduler));

    scheduler.goal = {
      id: 1,
      scheduledOn: (now - 86400) as UnixTimestamp /* yesterday */,
    };
    assert.isFalse(Scheduler.hasScheduledGoal(scheduler));

    scheduler.goal = { id: 1, scheduledOn: now };
    assert.isTrue(Scheduler.hasScheduledGoal(scheduler));
    assert.isTrue(Scheduler.canScheduleNext(scheduler));

    scheduler.goal = null;
    scheduler.lastComplete = UnixTimestamp.current();
    assert.isFalse(Scheduler.canScheduleNext(scheduler));

    scheduler.goal = null;
    scheduler.lastComplete = ((UnixTimestamp.current() as number) -
      scheduler.options.dailyLimit * 60) as UnixTimestamp;
    assert.isTrue(Scheduler.canScheduleNext(scheduler));

    scheduler.goal = null;
    scheduler.lastComplete = UnixTimestamp.current();
    assert.isFalse(Scheduler.canScheduleNext(scheduler));
  });

  it("scheduleNext", () => {
    const scheduler = Scheduler.create();

    const goals = [
      Goal.createEmpty(1),
      Goal.createEmpty(2),
      Goal.createEmpty(3),
      Goal.createEmpty(4),
    ];

    assert.isNull(scheduler.goal);
    assert.isTrue(Scheduler.canScheduleNext(scheduler));

    scheduler.goal = Scheduler.findNextSchedule(scheduler, goals);
    updateTime(goals, scheduler.goal?.id);
    if (!Scheduler.hasScheduledGoal(scheduler)) assert.fail();
    assert.equal(scheduler.goal?.id, 1);

    scheduler.goal = Scheduler.findNextSchedule(scheduler, goals);
    updateTime(goals, scheduler.goal?.id);
    if (!Scheduler.hasScheduledGoal(scheduler)) assert.fail();
    assert.equal(scheduler.goal?.id, 2);

    scheduler.goal = Scheduler.findNextSchedule(scheduler, goals);
    updateTime(goals, scheduler.goal?.id);
    if (!Scheduler.hasScheduledGoal(scheduler)) assert.fail();
    assert.equal(scheduler.goal?.id, 3);

    scheduler.goal = Scheduler.findNextSchedule(scheduler, goals);
    updateTime(goals, scheduler.goal?.id);
    if (!Scheduler.hasScheduledGoal(scheduler)) assert.fail();
    assert.equal(scheduler.goal?.id, 4);

    scheduler.goal = Scheduler.findNextSchedule(scheduler, goals);
    updateTime(goals, scheduler.goal?.id);
    assert.isNull(scheduler.goal);
  });
});

function updateTime(goals: Goal[], goalID: GoalID | null | undefined) {
  const goal = goals.find((g) => g.id === goalID);
  if (goal) goal.updatedTime = UnixTimestamp.current();
}
