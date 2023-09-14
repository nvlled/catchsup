import "./styles/GoalTraining.css";
import { Goal } from "../shared/goal";
import { useAppStore } from "./lib/state";
import { Actions } from "./lib/actions";
import { MarkdownContent, Space } from "./components";
import { useMemo, useRef, useState } from "react";
import { UnixTimestamp } from "../shared/datetime";
import { useOnMount, useTimer } from "./lib/reactext";
import { GoalLogs } from "./GoalLogs";
import { Action } from "./lib/jsext";
import { iconesJs } from "./lib/icons";

export interface Props {
  goal: Goal | null | undefined;
}

type ConfirmState = "accept" | "reject" | "prompt";

export function GoalTraining({ goal }: Props) {
  const [spinner, setSpinner] = useState(Math.random() <= 0.45 ? 0 : 1);
  const [activeTraining, allLogs] = useAppStore((state) => [
    state.activeTraining,
    state.trainingLogs,
  ]);
  const [confirmState, setConfirmState] = useState<ConfirmState>("prompt");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const startTime = activeTraining?.startTime ?? UnixTimestamp.current();
  const isDone = goal && Goal.isTrainingDone(goal, activeTraining);

  const logs = useMemo(() => {
    const result = allLogs.filter((g) => g.goalID === goal?.id);
    result.reverse();
    return result;
  }, [goal?.id, allLogs]);

  useOnMount(() => {
    let stop: Action | undefined;
    if (!isDone) {
      stop = Actions.playPromptSound();
    }

    return () => {
      stop?.();
    };
  });

  useTimer(10 * 1000);

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
              <em>
                Tip: Don't think too hard on what to write. Just write any
                detail that you think is notable. Keep it simple, write broken
                english if you must, or just put a list of key words or phrases.
                You can always put your full coherent thoughts somewhere else.
              </em>
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
              <br />
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setSpinner((spinner + 1) % 2)}
              >
                {spinner === 0 ? <Spinner0 /> : <Spinner1 />}
              </div>
            </div>
          )}

          <br />
          <hr />

          {goal.desc && (
            <MarkdownContent
              content={goal.desc}
              className={"goal-view-desc "}
            />
          )}
          {logs.length > 0 ? (
            <>
              <details>
                <summary>Logs</summary>
                <GoalLogs key={goal.id} logs={logs} />
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

function Spinner0() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          color: "gold",
          position: "absolute",
          fontSize: "900%",
          bottom: "10px",

          animation: "rotate 20s cubic-bezier(0.075, 0.82, 0.165, 1) infinite",
          display: "inline-block",
        }}
      >
        {iconesJs.gamesIconNorthStarShuriken}
      </div>
      <div
        className=""
        style={{
          fontSize: "600%",
          zIndex: "10",
          position: "relative",
        }}
      >
        {iconesJs.notoGorilla}
      </div>
    </div>
  );
}

function Spinner1() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          fontSize: "700%",
          fontWeight: 100,
          bottom: "50px",

          animation: "rotate 20s cubic-bezier(0.075, 0.82, 0.165, 1) infinite",
          display: "inline-block",
        }}
      >
        {iconesJs.gamesIconTrident}
      </div>
      <div
        className=""
        style={{
          fontSize: "700%",
          zIndex: "10",
          position: "relative",
        }}
      >
        {iconesJs.notoV1Shark}
      </div>
    </div>
  );
}
