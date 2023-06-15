import "normalize.css";
import "./styles/layout.css";
import "./styles/App.css";

import { useOnMount } from "./lib/reactext";
import GoalList from "./GoalList";
import { useAppStore } from "./lib/state";
import { Actions } from "./lib/actions";
import GoalView from "./GoalView";
import { GoalEditor } from "./GoalEditor";
import { GoalTraining } from "./GoalTraining";
import { useEffect } from "react";
import { About } from "./About";
import { SettingsView } from "./SettingsView";
import { Space } from "./components";
import { ElectronEvents, api } from "./lib/api";
import { Services } from "./lib/services";

let initialized = false;

function App() {
  useOnMount(() => {
    if (initialized) return;
    console.log("mounted");
    initialized = true;

    const fn = () => console.log("* screen locked");
    ElectronEvents.on("lock-screen", fn);

    Actions.init();
    Services.startAll();

    return () => {
      ElectronEvents.off("lock-screen", fn);

      Actions.deinit();
      Services.stopAll();
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
          <div className="flex-between">
            <a href="#" title="??" onClick={() => Actions.changePage("about")}>
              <img src={"icons/icon.png"} style={{ width: "30px" }} />
            </a>
            <div>
              <button onClick={() => Actions.changePage("settings")}>
                settings
              </button>
              <Space />
              <button onClick={() => Actions.changePage("create-goal")}>
                + add goal
              </button>
            </div>
          </div>
          <br />
          <GoalList goals={goals} />
        </>
      ) : page === "about" ? (
        <About />
      ) : page === "settings" ? (
        <SettingsView />
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
