import "./styles/GoalTraining.css";
import { Goal } from "./lib/goal";
import { Actions, useAppStore } from "./lib/state";
import { Space } from "./components";
import { useRef, useState } from "react";
import { UnixTimestamp } from "./lib/datetime";
import { useOnMount } from "./lib/reactext";
import { Howl } from "howler";

export interface Props {
  goal: Goal | null | undefined;
}

type ConfirmState = "accept" | "reject" | "prompt";

export function GoalTraining({ goal }: Props) {
  const activeTraining = useAppStore((state) => state.activeTraining);
  //const [elapsedMin, setElapsedMin] = useState(0);
  const [confirmState, setConfirmState] = useState<ConfirmState>("prompt");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const startTime = activeTraining?.startTime ?? UnixTimestamp.current();
  const isDone = goal && Goal.isTrainingDone(goal, activeTraining);

  useOnMount(() => {
    let sound: Howl | undefined;
    if (!isDone) {
      sound = Actions.playPromptSound();
    }

    return () => {
      sound?.stop();
    };
  });

  //useEffect(() => {
  //  const id = setInterval(() => {
  //    const now = UnixTimestamp.current();
  //    setElapsedMin((now - startTime) / 60);
  //  }, 1000);

  //  return () => clearInterval(id);
  //}, [startTime]);

  return (
    <div className="goal-training">
      {/*elapsed={elapsedMin.toFixed(2)} minutes*/}
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
                    //left: "0",
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
