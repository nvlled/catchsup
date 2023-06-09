import React, { ChangeEvent, useRef, useState } from "react";
import { Minutes, TrainingTime, WeekDay } from "../shared/datetime";
import { Goal, GoalID, SchedulingType } from "../shared/goal";
import { useOnMount } from "./lib/reactext";
import { Actions } from "./lib/actions";
import { ArrayUtil } from "./lib/jsext";
import "./styles/GoalEditor.css";
import { produce } from "immer";
import { TimeRangeLabel } from "../shared/datetime";
import { TimeNumber } from "../shared/datetime";
import { Space } from "./components";
import { Producer } from "./lib/immerext";
import { Rules } from "../shared/rules";

const schedulingTypeLabels: Record<SchedulingType, string> = {
  daily: "any day",
  weekly: "weekly",
  monthly: "monthly",
  disabled: "disabled",
};

const weekLabels: Record<WeekDay, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

type State =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "submitting" }
  | { type: "done" };

export interface Props {
  goal?: Goal;
  onSubmit: (goalID: GoalID) => void;
}

interface SubProps {
  goal: Goal;
  onChange: (goal: Goal) => void;
}

export function GoalEditor({ goal: goalProp, onSubmit }: Props) {
  const [state, setState] = useState<State>({ type: "ready" });
  const [editedGoal, setEditedGoal] = useState<Goal>(Goal.createEmpty());
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useOnMount(() => {
    if (goalProp) {
      setEditedGoal(goalProp);
      if (titleRef.current) titleRef.current.value = goalProp.title;
      if (descRef.current) descRef.current.value = goalProp.desc;
    }
  });

  return (
    <div className="goal-editor">
      <div>
        <h2>What do you want to do?</h2>
        <input
          ref={titleRef}
          name="title"
          placeholder="title"
          onChange={onInput}
        />
      </div>
      <br />
      <br />
      <div>
        <h2>Details or notes to keep in mind</h2>
        <textarea
          ref={descRef}
          onChange={onInput}
          placeholder="description"
          rows={5}
        ></textarea>
      </div>
      <br />
      <div>
        <h2>How long do you want to do this each day?</h2>
        <TimeDurationEditor goal={editedGoal} onChange={setEditedGoal} />
      </div>
      <br />
      <div>
        <h2>What days do you want to do this?</h2>
        <DaySchedEditor goal={editedGoal} onChange={setEditedGoal} />
      </div>
      <br />
      {editedGoal.schedulingType !== "disabled" && (
        <>
          <div>
            <h2>What ideal time?</h2>
            <TimeSchedEditor goal={editedGoal} onChange={setEditedGoal} />
          </div>
          <br />
        </>
      )}
      <div className="flex-between">
        <button
          onClick={handleSubmit}
          disabled={!["ready", "error"].includes(state.type)}
        >
          {editedGoal.id != 0 ? "save" : "create"}
        </button>
        {goalProp && (
          <button className="goal-editor-delete-button" onClick={handleDelete}>
            delete
          </button>
        )}
      </div>
      &nbsp;
      {state.type === "error" ? (
        <span>{state.message}</span>
      ) : state.type === "done" ? (
        <span>your changes have been saved</span>
      ) : null}
      <hr />
      <small>Note: the schedule is only for reminder notifications you</small>
    </div>
  );

  function onInput() {
    setState({ type: "ready" });
  }

  function handleSubmit() {
    setState({ type: "submitting" });
    const title = titleRef.current?.value.trim();
    const desc = descRef.current?.value.trim() ?? "";

    if (!title) {
      setState({ type: "error", message: "please give a title" });
      return;
    }

    const goal = produce(editedGoal, (draft) => {
      draft.title = title;
      draft.desc = desc;
      if (draft.trainingTime != goalProp?.trainingTime) {
        draft.resched = undefined;
      }
    });

    if (goal.id <= 0) {
      Actions.createGoal(goal);
    } else {
      Actions.modifyGoal(goal);
    }

    setState({
      type: "done",
    });

    setTimeout(() => {
      onSubmit(goal.id);
    }, 512);
  }

  function handleDelete() {
    if (editedGoal && confirm("Delete this?")) {
      Actions.deleteGoal(editedGoal);
    }
  }
}

function DaySchedEditor({ goal, onChange }: SubProps) {
  /*
  const produceChange = (fn: Producer<Goal>) =>
    onChange(
      produce(goal, (draft) => {
        fn(draft);
      })
    );
    */

  const { schedulingType: schedType, schedulingData: schedData } = goal;

  return (
    <div>
      <select value={schedType} onChange={handleChangeSchedType}>
        {Object.entries(schedulingTypeLabels).map(([type, label]) => (
          <option key={type} value={type}>
            {label}
          </option>
        ))}
      </select>
      <div className="m2">
        {schedType === "daily" ? (
          <div>
            {/*
            day interval{" "}
            <input
              type={"number"}
              value={schedData.daily.interval}
              onChange={handleChangeInterval}
            />
            <br />
            <label>
              <input
                type="checkbox"
                checked={dailyOptions.autoAdjust}
                onChange={handleChangeAutoAdjust}
              />
              auto adjust interval
            </label>
            {dailyOptions.autoAdjust && (
              <div>
                interval range: from
                <input
                  type="number"
                  value={dailyOptions.dayIntervalRange.min}
                  onChange={handleChangeMinInterval}
                />{" "}
                to
                <input
                  type="number"
                  value={dailyOptions.dayIntervalRange.max}
                  onChange={handleChangeMaxInterval}
                />
              </div>
            )}
            */}
          </div>
        ) : schedType === "weekly" ? (
          <div>
            <div className="weekday-selector">
              {Object.entries(weekLabels).map(([weekDay, label]) => (
                <label key={weekDay}>
                  <input
                    type="checkbox"
                    value={weekDay}
                    checked={
                      schedData.weekly.dayOfWeeks[weekDay as WeekDay] ?? false
                    }
                    onChange={() => handleToggleWeekday(weekDay as WeekDay)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ) : schedType === "monthly" ? (
          <div>
            <div className="date-selector">
              {ArrayUtil.range(1, 31).map((date) => (
                <React.Fragment key={date}>
                  <label>
                    <input
                      type="checkbox"
                      checked={schedData.monthly.dayOfMonths[date] ?? false}
                      onChange={() => handleToggleDate(date)}
                    />
                    {date}
                  </label>
                  {date % 7 === 0 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  function handleChangeSchedType(e: ChangeEvent<HTMLSelectElement>) {
    onChange(
      produce(goal, (draft) => {
        draft.schedulingType = e.target.value as SchedulingType;
      })
    );
  }

  function handleToggleWeekday(w: WeekDay) {
    onChange(
      produce(goal, (draft) => {
        const { dayOfWeeks } = draft.schedulingData.weekly;
        if (dayOfWeeks[w]) draft.schedulingData.weekly.dayOfWeeks[w] = false;
        else draft.schedulingData.weekly.dayOfWeeks[w] = true;
      })
    );
  }

  function handleToggleDate(d: number) {
    onChange(
      produce(goal, (draft) => {
        const { dayOfMonths } = draft.schedulingData.monthly;
        if (dayOfMonths[d]) delete dayOfMonths[d];
        else dayOfMonths[d] = true;
      })
    );
  }

  /*
  function handleChangeInterval(event: ChangeEvent<HTMLInputElement>): void {
    onChange(
      produce(goal, (draft) => {
        draft.schedulingData.daily.interval = event.target.valueAsNumber || 1;
      })
    );
  }
  function handleChangeMinInterval(event: ChangeEvent<HTMLInputElement>): void {
    produceChange((draft) => {
      draft.schedulingOptions.daily.dayIntervalRange.min =
        event.target.valueAsNumber || 1;
    });
  }

  function handleChangeMaxInterval(event: ChangeEvent<HTMLInputElement>): void {
    produceChange((draft) => {
      draft.schedulingOptions.daily.dayIntervalRange.max =
        event.target.valueAsNumber || 1;
    });
  }

  function handleChangeAutoAdjust(event: ChangeEvent<HTMLInputElement>): void {
    produceChange(
      (draft) =>
        (draft.schedulingOptions.daily.autoAdjust = event.target.checked)
    );
  }
  */
}

export function TimeSchedEditor({ goal, onChange }: SubProps) {
  const produceChange = (fn: Producer<Goal>) =>
    onChange(
      produce(goal, (draft) => {
        fn(draft);
      })
    );

  const { trainingTime } = goal;

  type Label = "around specific time" | TimeRangeLabel;
  const label: Label =
    typeof trainingTime === "number"
      ? "around specific time"
      : !Array.isArray(trainingTime)
      ? trainingTime
      : "early morning";

  const options: Label[] = [
    "auto",
    "early morning",
    "late morning",
    "early afternoon",
    "late afternoon",
    "early evening",
    "late evening",
    "late at night",
    "around specific time",
  ];

  let timeInput = <div />;
  if (typeof trainingTime === "number") {
    timeInput = (
      <label>
        <Space />
        <input
          type="time"
          value={TimeNumber.toString(trainingTime)}
          onChange={handleChangeTimeValue}
        />
      </label>
    );
  }

  return (
    <div className="flex-left">
      <select value={label} onChange={handleChangeTimeType}>
        {options.map((value) => (
          <option key={value} value={value}>
            {value === "auto" ? "any time" : value}{" "}
            {value != "auto" && TrainingTime.toString(value as TrainingTime)}
          </option>
        ))}
      </select>
      {label === "around specific time" && timeInput}
    </div>
  );

  function handleChangeTimeType(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Label;
    if (value === "around specific time") {
      produceChange((draft) => {
        draft.trainingTime = 600 as TimeNumber;
      });
    } else {
      produceChange((draft) => {
        draft.trainingTime = value;
      });
    }
  }
  function handleChangeTimeValue(e: ChangeEvent<HTMLInputElement>) {
    const [hour = 0, min = 0] =
      e.target.value.split(":").map((f) => parseInt(f, 10)) ?? [];

    produceChange((draft) => {
      draft.trainingTime = TimeNumber.construct(hour, min);
    });
  }
}

function TimeDurationEditor({ goal, onChange }: SubProps) {
  const produceChange = (fn: Producer<Goal>) =>
    onChange(
      produce(goal, (draft) => {
        fn(draft);
      })
    );

  return (
    <div className="bordered">
      duration:
      <Space />
      <input
        type="number"
        value={goal.trainingDuration}
        min={5}
        max={60 * 8}
        onChange={handleDurationChange}
      />
      minutes
      <Space count={2} />
      |
      <Space count={2} />
      overtime:
      <Space />
      <input
        type="number"
        value={goal.overtime ?? Rules.defaults.overtime}
        min={0}
        max={goal.trainingDuration ?? 1}
        onChange={handleCooldownChange}
      />
      minutes
      <br />
      <details>
        <summary>info</summary>
        <ul>
          <li>
            for new goals, you should start with a small duration, like 15
            minutes
          </li>
          <li>
            overtime is for additional time for things you need to do before
            stopping, like note taking.
          </li>
        </ul>
      </details>
      {/*
      <br />
      <label>
        <input
          type="checkbox"
          checked={durationOptions.autoAdjust}
          onChange={handleChangeAutoAdjust}
        />
        auto adjust interval
      </label>
      {durationOptions.autoAdjust && (
        <div>
          interval range: from
          <input
            type="number"
            value={durationOptions.durationRange.min}
            onChange={handleChangeMinInterval}
          />{" "}
          to
          <input
            type="number"
            value={durationOptions.durationRange.max}
            onChange={handleChangeMaxInterval}
          />
        </div>
      )}
      */}
    </div>
  );

  function handleDurationChange(e: ChangeEvent<HTMLInputElement>) {
    produceChange(
      (draft) => (draft.trainingDuration = e.target.valueAsNumber as Minutes)
    );
  }
  function handleCooldownChange(e: ChangeEvent<HTMLInputElement>) {
    produceChange((draft) => (draft.overtime = e.target.valueAsNumber));
  }

  /*
  function handleChangeAutoAdjust(e: ChangeEvent<HTMLInputElement>) {
    produceChange(
      (draft) => (draft.durationOptions.autoAdjust = e.target.checked)
    );
  }
  function handleChangeMinInterval(e: ChangeEvent<HTMLInputElement>): void {
    produceChange(
      (draft) =>
        (draft.durationOptions.durationRange.min = e.target.valueAsNumber)
    );
  }
  function handleChangeMaxInterval(e: ChangeEvent<HTMLInputElement>): void {
    produceChange(
      (draft) =>
        (draft.durationOptions.durationRange.max = e.target.valueAsNumber)
    );
  }
  */
}
