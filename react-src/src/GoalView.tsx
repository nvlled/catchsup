import "./styles/GoalView.css";

import { useState } from "react";
import { Goal } from "./lib/goal";
import { Actions, useAppStore } from "./lib/state";
import { GoalEditor } from "./GoalEditor";
import { marked } from "marked";
import { Space } from "./components";
import { UnixTimestamp } from "./lib/datetime";
import { produce } from "immer";

export interface Props {
  goal?: Goal;
}
export default function GoalView({ goal }: Props) {
  const [edit, setEdit] = useState(false);
  const [showMore, setShowMore] = useState(new Set<number>());

  const logs = useAppStore((state) =>
    state.trainingLogs.filter((g) => g.goalID === goal?.id && g.notes)
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
          <hr />
          <h3>Notes</h3>
        </>
      ) : null}
      <br />
      {logs.map((e) => {
        if (!e.notes) return null;
        const shown = showMore.has(e.startTime);
        let html = marked.parse(e.notes);
        if (!shown) {
          html = html.slice(0, 250) + "...";
        }
        return (
          <div className="goal-view-note-entry">
            <span className="goal-view-note-entry-date">
              <Space />[{UnixTimestamp.toDateNumber(e.startTime)}]
              <button onClick={() => handleShowMore(e.startTime)}>
                {shown ? "less" : "more"}
              </button>
            </span>

            <span
              dangerouslySetInnerHTML={{
                __html: html,
              }}
            />
          </div>
        );
      })}
    </div>
  );

  function handleShowMore(t: UnixTimestamp) {
    setShowMore(
      produce(showMore, (draft) => {
        if (draft.has(t)) draft.delete(t);
        else draft.add(t);
      })
    );
  }
}
