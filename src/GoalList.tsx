import { useState } from "react";
import { Space } from "./components";
import { Goal, goalDueStateImages } from "../shared/goal";
import { classes, useChanged, useTimer } from "./lib/reactext";
import { useAppStore } from "./lib/state";
import "./styles/GoalList.css";

import { getRandomQuote } from "./quotes";
import { ArrayUtil, call, partition } from "./lib/jsext";
import { Actions } from "./lib/actions";
import { DateNumber, UnixTimestamp } from "../shared/datetime";

interface Props {
  goals: Goal[];
  dueOnly?: boolean;
}

export default function GoalList({ goals }: Props) {
  const [lastCompleted, scheduler, hideGoalList] = useAppStore((state) => [
    state.lastCompleted,
    state.scheduler,
    state.goalList.hideGoalList,
  ]);
  const doneToday = lastCompleted === DateNumber.current();
  const [quote, setQuote] = useState(getRandomQuote());
  const dueStates = Goal.getDueStates(goals);

  if (useChanged(goals)) {
    setQuote(getRandomQuote());
  }

  useTimer(60 * 1000);

  const sortedGoals = call(() => {
    const [otherGoals, disabledGoals] = partition(
      hideGoalList ? [] : goals,
      (g) => g.schedulingType !== "disabled"
    );
    return otherGoals.concat(disabledGoals);
  });

  const goalID = scheduler.goal?.id;
  const dueGoal = !goalID ? undefined : goals.find((g) => g.id === goalID);

  const minutesUntilNextGoal =
    scheduler.scheduleInterval -
    UnixTimestamp.since(scheduler.lastComplete) / 60;

  return (
    <div className="goal-list">
      {doneToday ? (
        <div className="flex-center">
          <h1>You've done enough for today. Well done.</h1>
        </div>
      ) : dueGoal ? (
        <div className="flex-center">
          <h1
            className="goal-list-due-goal"
            onClick={() => handleOpen(dueGoal)}
          >
            <a href="#">*{dueGoal.title}</a>
          </h1>
          <Space count={5} />
        </div>
      ) : null}
      <br />
      <div
        className="goal-list-quote"
        title={quote.from}
        onClick={() => setQuote(getRandomQuote())}
      >
        {quote.text}
      </div>
      {!scheduler.goal && (
        <small>
          time to wait until next goal: {minutesUntilNextGoal.toFixed(2)}mins
        </small>
      )}
      <br />
      <div className="flex-left">
        <button onClick={handleRandomSelect}>random goal</button>
        <Space count={5} />
        <a href="#" onClick={handleToggleShowAll}>
          {hideGoalList ? "show list" : "hide"}
        </a>
      </div>
      <ul className="goal-list-entries">
        {sortedGoals.map((e) => (
          <li
            key={e.id}
            className={classes(
              "goal-list-entry",
              e.schedulingType === "disabled" && "disabled"
            )}
            onClick={() => handleOpen(e)}
          >
            <div
              className={classes("goal-list-entry-marker ", dueStates[e.id])}
              title={
                dueStates[e.id] === "due-now"
                  ? "do now!?"
                  : dueStates[e.id] === "due-later"
                  ? "do later today"
                  : dueStates[e.id] === "was-due"
                  ? "missed, you can still do it"
                  : "-"
              }
            >
              {goalDueStateImages[dueStates[e.id]] &&
                (dueStates[e.id] === "due-now"
                  ? "!"
                  : dueStates[e.id] === "due-later"
                  ? "@"
                  : dueStates[e.id] === "was-due"
                  ? "?"
                  : "-")}
            </div>
            <Space />
            <div>{e.title}</div>
          </li>
        ))}
      </ul>
      <br />
      <hr />
      <h3>Reminders</h3>
      <ul>
        <li>Avoid browsing the internet, set everything up before starting</li>
        <li>
          Focus solely on the activity, or cancel if something is more urgent
        </li>
        <li>Try to stick to 15 minute rule when starting a new activity</li>
      </ul>
    </div>
  );

  function handleToggleShowAll() {
    Actions.toggleGoalList();
  }

  function handleRandomSelect() {
    const dueGoals = goals.filter((g) => {
      const state = Goal.checkDue(g);
      return state === "due-now" || state === "was-due";
    });
    const goal = ArrayUtil.randomSelect(dueGoals);
    if (goal) {
      handleOpen(goal);
    }
  }

  function handleOpen(goal: Goal) {
    useAppStore.setState({
      page: "view-goal",
      activeTraining: {
        goalID: goal.id,
        silenceNotification: false,
      },
    });
  }
}
