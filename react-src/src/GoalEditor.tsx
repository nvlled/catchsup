import React, { useRef, useState } from "react";
import { WeekDay } from "./lib/datetime";
import { Goal, GoalID, SchedulingType } from "./lib/goal";
import { useOnMount } from "./lib/reactext";
import { Actions } from "./lib/state";
import { ArrayUtil } from "./lib/util";
import "./styles/GoalEditor.css";
import { produce } from "immer";

//export interface Props {}

const schedulingTypeLabels: Record<SchedulingType, string> = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
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
export function GoalEditor({ goal, onSubmit }: Props) {
  const [state, setState] = useState<State>({ type: "ready" });
  const [editedGoal, setEditedGoal] = useState<Goal>(Goal.createEmpty());
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useOnMount(() => {
    if (goal) {
      setEditedGoal(goal);
      if (titleRef.current) titleRef.current.value = goal.title;
      if (descRef.current) descRef.current.value = goal.desc;
    }
  });

  return (
    <div className="goal-editor">
      <div>
        <h2>What do you want to do?</h2>
        <input ref={titleRef} placeholder="title" onChange={onInput} />
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
          cols={60}
        ></textarea>
      </div>
      <div>
        <h2>What days do you want to do this?</h2>
        <DaySchedEditor goal={editedGoal} onChange={setEditedGoal} />
      </div>
      <br />
      <br />
      <div>
        <h2>What ideal time?</h2>
        <TimeSchedEditor goal={editedGoal} onChange={setEditedGoal} />
      </div>
      <br />
      <button
        onClick={handleSubmit}
        disabled={!["ready", "error"].includes(state.type)}
      >
        {editedGoal.id != 0 ? "save" : "create"}
      </button>
      &nbsp;
      {state.type === "error" ? (
        <span>{state.message}</span>
      ) : state.type === "done" ? (
        <span>goal created!?!?</span>
      ) : null}
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
}

export function DaySchedEditor({
  goal,
  onChange,
}: {
  goal: Goal;
  onChange: (goal: Goal) => void;
}) {
  const {
    schedulingType: schedType,
    schedulingData: schedData,
    schedulingOptions: schedOptions,
  } = goal;
  const { daily: dailyOptions } = schedOptions;

  function produceChange(fn: (draft: Goal) => void) {
    onChange(
      produce(goal, (draft) => {
        fn(draft);
      })
    );
  }

  return (
    <div>
      <select value={schedType} onChange={handleChangeSchedType}>
        {Object.entries(schedulingTypeLabels).map(([type, label]) => (
          <option key={type} value={type}>
            {label}
          </option>
        ))}
      </select>
      <div className="m5">
        {schedType === "daily" ? (
          <div>
            day interval{" "}
            <input
              type={"number"}
              value={schedData.daily.interval}
              onChange={handleChangeInterval}
            />
            <br />
            <input
              type="checkbox"
              checked={dailyOptions.autoAdjust}
              onChange={handleChangeAutoAdjust}
            />
            auto adjust interval
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

  function handleChangeSchedType(e: React.ChangeEvent<HTMLSelectElement>) {
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

  function handleChangeInterval(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    onChange(
      produce(goal, (draft) => {
        draft.schedulingData.daily.interval = event.target.valueAsNumber || 1;
      })
    );
  }
  function handleChangeMinInterval(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    produceChange((draft) => {
      draft.schedulingOptions.daily.dayIntervalRange.min =
        event.target.valueAsNumber || 1;
    });
  }

  function handleChangeMaxInterval(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    produceChange((draft) => {
      draft.schedulingOptions.daily.dayIntervalRange.max =
        event.target.valueAsNumber || 1;
    });
  }

  function handleChangeAutoAdjust(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    produceChange(
      (draft) =>
        (draft.schedulingOptions.daily.autoAdjust = event.target.checked)
    );
  }
}

export function TimeSchedEditor({
  goal,
  onChange,
}: {
  goal: Goal;
  onChange: (goal: Goal) => void;
}) {
  return <div>TODO {goal.id}</div>;
}
