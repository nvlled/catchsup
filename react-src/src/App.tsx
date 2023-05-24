import "normalize.css";
import "./styles/layout.css";
import "./styles/App.css";

import { useOnMount } from "./lib/reactext";
import GoalList from "./GoalList";
import { Actions, useAppStore } from "./lib/state";
import GoalView from "./GoalView";
import { GoalEditor } from "./GoalEditor";
import { GoalTraining } from "./GoalTraining";
import { useEffect } from "react";

let initialized = false;

function App() {
  useOnMount(() => {
    if (initialized) return;
    console.log("mounted");
    initialized = true;

    Actions.init();

    return () => {
      Actions.deinit();
      console.log("app unmount");
    };
  });

  const [dueStates, page, goals, viewGoal] = useAppStore((state) => [
    state.dueStates,
    state.page,
    state.goals,
    state.goals.find((e) => e.id === state.activeTraining?.goalID),
  ]);

  useEffect(() => {
    console.log("due states changed");
  }, [dueStates]);

  return (
    <>
      {page === "home" ? (
        <>
          <div className="flex-right">
            <button onClick={() => Actions.changePage("create-goal")}>
              + add goal
            </button>
          </div>
          <br />
          <GoalList goals={goals} />
        </>
      ) : page === "create-goal" ? (
        <>
          <div className="flex-right">
            <button
              className="clear"
              onClick={() => Actions.changePage("home")}
            >
              ← back
            </button>
          </div>
          <GoalEditor onSubmit={handleGoalCreate} />
        </>
      ) : page === "view-goal" ? (
        <GoalView goal={viewGoal} />
      ) : page === "training" ? (
        <GoalTraining goal={viewGoal} />
      ) : (
        <div>invalid appstate {page}</div>
      )}

      {/*
      <audio ref={audioRef} src="" controls />
      <button onClick={handlePlay}>play sound</button>
    */}
    </>
  );

  function handleGoalCreate() {
    Actions.changePage("home");
  }
}

export default App;
