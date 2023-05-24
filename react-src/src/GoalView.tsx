import "./styles/GoalView.css";

import { useState } from "react";
import { Goal } from "./lib/goal";
import { Actions, useAppStore } from "./lib/state";
import { GoalEditor } from "./GoalEditor";
import { marked } from "marked";
import { Space } from "./components";
import { TrainingTime, UnixTimestamp } from "./lib/datetime";
import { GoalLogs } from "./GoalLogs";

export interface Props {
  goal?: Goal;
}
export default function GoalView({ goal }: Props) {
  const [edit, setEdit] = useState(false);

  const logs = useAppStore((state) =>
    state.trainingLogs.filter((g) => g.goalID === goal?.id).reverse()
  );

  if (!goal) {
    return (
      <div>there is no goal, there is no purpose, why are you even here</div>
    );
  }

  if (edit) {
    return (
      <div className="goal-view">
        <div className="flex-right">
          <button className="clear" onClick={() => setEdit(false)}>
            ← back
          </button>
        </div>
        <GoalEditor key={goal.id} goal={goal} onSubmit={() => setEdit(false)} />
      </div>
    );
  }

  return (
    <div className="goal-view">
      <div className="flex-right">
        <button className="clear" onClick={() => Actions.changePage("home")}>
          ← back
        </button>
      </div>
      <div className="goal-view-header">
        <h1>{goal.title}</h1>
        <Space />
        <small>
          <button onClick={() => setEdit(true)}>edit</button>
        </small>
      </div>
      {TrainingTime.toString(goal.trainingTime)}
      <Space /> | <Space />
      {Goal.getScheduleSummary(goal)}
      <br />
      {goal.desc && (
        <div dangerouslySetInnerHTML={{ __html: marked.parse(goal.desc) }} />
      )}
      <br />
      <div className="flex-center">
        <button
          className="goal-view-start"
          onClick={() => Actions.startGoalTraining(goal)}
        >
          start
        </button>
      </div>
      <br />
      {logs.length > 0 ? (
        <>
          <h3>Logs</h3>
          <hr />
          <GoalLogs logs={logs} />
        </>
      ) : null}
    </div>
  );
}
