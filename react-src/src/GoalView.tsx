import { useState } from "react";
import { Goal } from "./lib/goal";
import { Actions } from "./lib/state";
import { GoalEditor } from "./GoalEditor";

export interface Props {
  goal?: Goal;
}
export default function GoalView({ goal }: Props) {
  const [edit, setEdit] = useState(false);
  if (!goal) {
    return <div>there is no goal</div>;
  }

  if (edit) {
    return (
      <div>
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
    <div>
      <div className="flex-right">
        <button className="clear" onClick={() => Actions.changePage("home")}>
          ← back
        </button>
      </div>
      {goal.title} <button onClick={() => setEdit(true)}>edit</button>
      <br />
      {goal.desc && (
        <div>
          <hr />
          {goal.desc}
          <hr />
        </div>
      )}
      <button>start</button>
    </div>
  );
}
