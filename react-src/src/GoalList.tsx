import { useState } from "react";
import { Space } from "./components";
import { Goal } from "./lib/goal";
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
            <div className={"goal-list-entry-marker " + dueStates[e.id]}>
              {dueStates[e.id] === "due-now"
                ? "!"
                : dueStates[e.id] === "due-today"
                ? "@"
                : "-"}
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
      },
    });
  }
}
