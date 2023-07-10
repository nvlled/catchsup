import "./styles/GoalView.css";

import { ChangeEvent, useState } from "react";
import { Goal } from "../shared/goal";
import { useAppStore } from "./lib/state";
import { Actions } from "./lib/actions";
import { GoalEditor } from "./GoalEditor";
import { MarkdownContent, Space } from "./components";
import { DateNumber, TimeNumber, TrainingTime } from "../shared/datetime";
import { GoalLogs } from "./GoalLogs";
import { produce } from "immer";
import { call } from "./lib/jsext";

export interface Props {
  goal?: Goal;
}
export default function GoalView({ goal }: Props) {
  const [edit, setEdit] = useState(false);
  const [resched, setResched] = useState(false);
  const [truncateDesc, setTruncateDesc] = useState(true);

  const logs = useAppStore((state) =>
    state.trainingLogs.filter((g) => g.goalID === goal?.id)
  );

  if (!goal) {
    return (
      <div>
        there is no goal, there is no purpose, why are you even here
        <button className="clear" onClick={() => setEdit(false)}>
          ← return
        </button>
      </div>
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

  const trainingTime = Goal.getTrainingTime(goal);

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
        <strong>#{goal.id}</strong>
        <Space />
        <small>
          <button onClick={() => setEdit(true)}>edit</button>
        </small>
      </div>
      <span>
        {goal.resched?.date === DateNumber.current() && "*"}
        {trainingTime === "auto"
          ? "any time"
          : TrainingTime.toString(trainingTime)}
      </span>
      <Space /> | <Space />
      {Goal.getScheduleSummary(goal)}
      <br />
      {resched && (
        <>
          <ReschedForm goal={goal} onSubmit={handleResched} />
          <hr />
          <br />
        </>
      )}
      <br />
      {goal.desc && (
        <>
          <MarkdownContent
            content={goal.desc}
            className={"goal-view-desc " + (truncateDesc ? "truncate" : "")}
          />
          {goal.desc.length > 250 && (
            <a href="#" onClick={handleToggleDesc}>
              <small>{truncateDesc ? "show more" : "show less"}</small>
            </a>
          )}
        </>
      )}
      <br />
      <div className="flex-center flex-col">
        <small>{goal.trainingDuration} minutes</small>
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

  function handleToggleDesc() {
    setTruncateDesc(!truncateDesc);
  }

  function handleResched(tempGoal?: Goal) {
    setResched(false);
    if (!tempGoal || !goal) {
      return;
    }
    const updatedGoal = produce(goal, (draft) => {
      draft.resched = {
        trainingTime: tempGoal.trainingTime,
        date: DateNumber.current(),
      };
    });
    Actions.modifyGoal(updatedGoal);
    Actions.produceNextState((draft) => {
      draft.activeTraining = null;
      draft.page = "home";
    });
  }
}

function ReschedForm({
  goal: goalProp,
  onSubmit,
}: {
  goal: Goal;
  onSubmit: (goal: Goal) => void;
}) {
  const [time, setTime] = useState(
    call(() => {
      const now = TimeNumber.current();
      const [start] = TrainingTime.getTimeRange(Goal.getTrainingTime(goalProp));
      let t = now < start ? start : now;
      //t = TimeNumber.addHours(t, 15 / 60);
      t = TimeNumber.addHours(t, 1 / 60);
      return TrainingTime.toString(t);
    })
  );

  return (
    <div className="flex-left">
      <h3>Reschedule for today</h3>
      <Space />
      <input type="time" value={time} onChange={handleChange} />
      <Space />
      <button onClick={handleSubmit}>confirm</button>
    </div>
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setTime(e.target.value);
  }

  function handleSubmit() {
    onSubmit(
      produce(goalProp, (draft) => {
        draft.trainingTime = TimeNumber.fromString(time);
      })
    );
  }
}
