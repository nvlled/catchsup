import { useState } from "react";
import { Space } from "./components";
import { Goal, goalDueStateImages } from "../shared/goal";
import { classes, useChanged, useTimer } from "./lib/reactext";
import { useAppStore } from "./lib/state";
import "./styles/GoalList.css";

import { getRandomQuote } from "./quotes";
import { call, partition } from "./lib/jsext";

interface Props {
  goals: Goal[];
}

export default function GoalList({ goals }: Props) {
  const scheduler = useAppStore((state) => state.scheduler);
  const [quote, setQuote] = useState(getRandomQuote());
  const dueStates = Goal.getDueStates(goals);

  if (useChanged(goals)) {
    setQuote(getRandomQuote());
  }

  useTimer(60 * 1000);

  const sortedGoals = call(() => {
    const [otherGoals, disabledGoals] = partition(
      goals,
      (g) => g.schedulingType !== "disabled"
    );
    return otherGoals.concat(disabledGoals);
  });

  const goalID = scheduler.goal?.id;
  const dueGoal = !goalID ? undefined : goals.find((g) => g.id === goalID);

  return (
    <div className="goal-list">
      {dueGoal && (
        <div>
          <h1
            className="goal-list-due-goal"
            onClick={() => handleOpen(dueGoal)}
          >
            <a href="#">{dueGoal.title}</a>
          </h1>
        </div>
      )}
      <br />
      <div
        className="goal-list-quote"
        title={quote.from}
        onClick={() => setQuote(getRandomQuote())}
      >
        {quote.text}
      </div>
      <br />

      <ul>
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
