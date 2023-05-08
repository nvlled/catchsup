import { Space } from "./components";
import { Goal } from "./lib/goal";
import { useAppStore } from "./lib/state";
import "./styles/GoalList.css";

interface Props {
  goals: Goal[];
}

export default function GoalList({ goals }: Props) {
  const dueStates = useAppStore((state) => state.dueStates) ?? {};
  return (
    <div className="goal-list">
      {goals.map((e) => (
        <div
          key={e.id}
          className="goal-list-entry"
          onClick={() => handleOpen(e)}
        >
          <div>
            {dueStates[e.id] === "due-now"
              ? "!"
              : dueStates[e.id] === "due-today"
              ? "@"
              : "."}
          </div>
          <Space />
          <div>
            [{e.id}] {e.title}
          </div>
        </div>
      ))}
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
