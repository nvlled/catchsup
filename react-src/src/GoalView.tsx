import "./styles/GoalView.css";

import { ChangeEvent, useState } from "react";
import { Goal } from "./lib/goal";
import { Actions, useAppStore } from "./lib/state";
import { GoalEditor } from "./GoalEditor";
import { marked } from "marked";
import { Space } from "./components";
import { DateNumber, TimeNumber, TrainingTime } from "./lib/datetime";
import { GoalLogs } from "./GoalLogs";
import { produce } from "immer";
import { call } from "./lib/jsext";

export interface Props {
  goal?: Goal;
}
export default function GoalView({ goal }: Props) {
  const [edit, setEdit] = useState(false);
  const [resched, setResched] = useState(false);

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
      <button onClick={() => setResched(!resched)}>
        {goal.resched?.date === DateNumber.current() && "*"}
        {TrainingTime.toString(Goal.getTrainingTime(goal))}
      </button>
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
      t = TimeNumber.addHours(t, 15 / 60);
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
    const now = TimeNumber.addHours(TimeNumber.current(), 15 / 60);
    const newTime = TimeNumber.fromString(e.target.value);
    if (newTime > now) {
      setTime(e.target.value);
    }
  }

  function handleSubmit() {
    onSubmit(
      produce(goalProp, (draft) => {
        draft.trainingTime = TimeNumber.fromString(time);
      })
    );
  }
}
