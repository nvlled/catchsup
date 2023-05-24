import { useState } from "react";
import { Space } from "./components";
import { Goal, goalDueStateImages } from "./lib/goal";
import { useChanged } from "./lib/reactext";
import { useAppStore } from "./lib/state";
import "./styles/GoalList.css";

import { getRandomQuote } from "./quotes";

interface Props {
  goals: Goal[];
}

export default function GoalList({ goals }: Props) {
  const [quote, setQuote] = useState(getRandomQuote());
  const dueStates = useAppStore((state) => state.dueStates) ?? {};

  if (useChanged(goals)) {
    setQuote(getRandomQuote());
  }

  return (
    <div className="goal-list">
      <div
        className="goal-list-quote"
        title={quote.from}
        onClick={() => setQuote(getRandomQuote())}
      >
        {quote.text}
      </div>
      <br />
      <ul>
        {goals.map((e) => (
          <li
            key={e.id}
            className="goal-list-entry"
            onClick={() => handleOpen(e)}
          >
            <div
              className={"goal-list-entry-marker " + dueStates[e.id]}
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
              {goalDueStateImages[dueStates[e.id]] && (
                <img src={goalDueStateImages[dueStates[e.id]]} />
              )}
            </div>
            <Space />
            <div>{e.title}</div>
          </li>
        ))}
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
