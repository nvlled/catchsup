import "./styles/GoalTraining.css";
import { Goal } from "../shared/goal";
import { useAppStore } from "./lib/state";
import { Actions } from "./lib/actions";
import { Space } from "./components";
import { useRef, useState } from "react";
import { UnixTimestamp } from "../shared/datetime";
import { useOnMount, useTimer } from "./lib/reactext";
import { marked } from "marked";
import { GoalLogs } from "./GoalLogs";
import { Action } from "./lib/jsext";

export interface Props {
  goal: Goal | null | undefined;
}

type ConfirmState = "accept" | "reject" | "prompt";

export function GoalTraining({ goal }: Props) {
  const activeTraining = useAppStore((state) => state.activeTraining);
  const [confirmState, setConfirmState] = useState<ConfirmState>("prompt");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const startTime = activeTraining?.startTime ?? UnixTimestamp.current();
  const isDone = goal && Goal.isTrainingDone(goal, activeTraining);

  const logs = useAppStore((state) =>
    state.trainingLogs.filter((g) => g.goalID === goal?.id).reverse()
  );

  useOnMount(() => {
    let stop: Action | undefined;
    if (!isDone) {
      stop = Actions.playPromptSound();
    }

    return () => {
      stop?.();
    };
  });

  useTimer(1000);

  return (
    <div className="goal-training">
      {!goal ? (
        <>
          goal not found
          <button onClick={() => Actions.changePage("home")}>back</button>
        </>
      ) : (
        <>
          <div className="goal-training-header">
            <h1>{goal.title}</h1>
            <div>
              <small>
                {goal.trainingDuration} minutes
                <Space />
                {!isDone && (
                  <button onClick={() => Actions.cancelGoalTraining(goal)}>
                    cancel
                  </button>
                )}
                <Space />
                <button onClick={handleToggleNotifications}>
                  notifications:{" "}
                  {activeTraining?.silenceNotification ? "off" : "on"}
                </button>
              </small>
            </div>
          </div>

          <br />

          {isDone ? (
            <div>
              <br />
              <br />
              You've done well. You can put some notes here if any.
              <br />
              <textarea
                ref={notesRef}
                placeholder="(optional"
                disabled={confirmState === "accept"}
              />
              <br />
              <button
                onClick={handleAccept}
                disabled={confirmState === "accept"}
              >
                I'm done
              </button>
              <br />
              {confirmState === "accept" && (
                <div className="goal-training-reward-text">
                  <br />
                  Good job!
                  <br />
                </div>
              )}
              <br />
              <i>
                Note: you can keep on going if you want, but you may want to
                initially pace yourself when building a new habit.
              </i>
              <br />
            </div>
          ) : (
            <div>
              <br />
              <br />
              <h2 className="flex-center" style={{ zIndex: "20" }}>
                now ongoing...
              </h2>
              <br />
              <div className="goal-training-spinner-container">
                <div
                  className="goal-training-spinner"
                  style={{
                    color: "gold",
                    position: "absolute",
                    fontSize: "900%",
                    bottom: "-10px",
                  }}
                >
                  ✯
                </div>
                <div
                  className=""
                  style={{
                    fontSize: "500%",
                    zIndex: "10",
                    position: "relative",
                  }}
                >
                  🦍
                </div>
              </div>
            </div>
          )}

          <br />
          <hr />

          {goal.desc && (
            <div
              dangerouslySetInnerHTML={{ __html: marked.parse(goal.desc) }}
            />
          )}
          {logs.length > 0 ? (
            <>
              <details>
                <summary>Logs</summary>
                <GoalLogs logs={logs} />
              </details>
            </>
          ) : null}
        </>
      )}
    </div>
  );

  function handleAccept() {
    setConfirmState("accept");
    Actions.playRewardSound();
    if (goal) {
      setTimeout(() => {
        const now = UnixTimestamp.current();
        const elapsedMin = (now - startTime) / 60;
        Actions.finishGoalTraining(goal, elapsedMin, notesRef.current?.value);
      }, 3000);
    }
  }

  function handleToggleNotifications() {
    Actions.toggleActiveTrainingNotifications();
  }
}
