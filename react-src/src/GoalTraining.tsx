import "./styles/GoalTraining.css";
import { Goal } from "./lib/goal";
import { Actions, useAppStore } from "./lib/state";
import { Space } from "./components";
import { useEffect, useRef, useState } from "react";
import { UnixTimestamp } from "./lib/datetime";

export interface Props {
  goal: Goal | null | undefined;
}

type ConfirmState = "accept" | "reject" | "prompt";

export function GoalTraining({ goal }: Props) {
  const activeTraining = useAppStore((state) => state.activeTraining);
  const [elapsedMin, setElapsedMin] = useState(0);
  const [confirmState, setConfirmState] = useState<ConfirmState>("prompt");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const startTime = activeTraining?.startTime ?? UnixTimestamp.current();
  const isDone = goal && Goal.isTrainingDone(goal, startTime);

  useEffect(() => {
    const id = setInterval(() => {
      const now = UnixTimestamp.current();
      setElapsedMin((now - startTime) / 60);
    }, 1000);

    return () => clearInterval(id);
  }, [startTime]);

  return (
    <div className="goal-training">
      elapsed={elapsedMin.toFixed(2)} minutes
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
                  <button onClick={() => Actions.cancelGoalTraining()}>
                    cancel
                  </button>
                )}
              </small>
            </div>
          </div>

          <br />

          {isDone ? (
            <div>
              Okay, that's it for now. Do you anything in mind?
              <br />
              <textarea ref={notesRef} placeholder="(optional" />
              <br />
              <br />
              <div className="">
                Just to be sure, you did the thing right? And not get
                distracted?
              </div>
              <div className="goal-training-confirm">
                <button onClick={handleAccept}>Yeah, I did it</button>
                <Space count={10} />
                <button onClick={handleReject}>
                  Nope, got distracted by other things
                </button>
              </div>
              <br />
              {confirmState === "accept" ? (
                <div>Good job!</div>
              ) : confirmState === "reject" ? (
                <div>
                  Aw fiddlesticks, do you want to try again?
                  <br />
                  <button onClick={handleReset}>Ye, start over</button>
                  <Space count={10} />
                  <button onClick={handleGoBack}>
                    No, maybe some other time{" "}
                  </button>
                </div>
              ) : null}
              <br />
            </div>
          ) : (
            <div className="goal-training-spinner-container">
              <br />
              <div className="goal-training-spinner" style={{ color: "gold" }}>
                ✯
              </div>
              <div className="goal-training-spinner">🦍</div>
            </div>
          )}
        </>
      )}
    </div>
  );

  function handleAccept() {
    setConfirmState("accept");
    if (goal) {
      setTimeout(() => {
        const now = UnixTimestamp.current();
        const elapsedMin = (now - startTime) / 60;
        Actions.finishGoalTraining(goal, elapsedMin, notesRef.current?.value);
      }, 1000);
    }
  }
  function handleReject() {
    setConfirmState("reject");
  }
  function handleReset() {
    setConfirmState("prompt");
    if (goal) {
      Actions.startGoalTraining(goal);
    }
  }
  function handleGoBack() {
    Actions.changePage("home");
  }
}
