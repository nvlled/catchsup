import "normalize.css";
import "./styles/layout.css";
import "./styles/App.css";

import { useOnMount } from "./lib/reactext";
import GoalList from "./GoalList";
import { State, useAppStore } from "./lib/state";
import { Actions } from "./lib/actions";
import GoalView from "./GoalView";
import { GoalEditor } from "./GoalEditor";
import { GoalTraining } from "./GoalTraining";
import { About } from "./About";
import { SettingsView } from "./SettingsView";
import { Space } from "./components";
import { createServices } from "./lib/services";
import { api } from "./lib/api";
import { Scheduler } from "../shared/scheduler";
import { call } from "./lib/jsext";
import { TrainingLog } from "../shared/goal";
import { DateNumber } from "../shared/datetime";
import { DailyLogs } from "./DailyLogs";

function DailyLimit() {
  const [lastCompleted, logs, scheduler] = useAppStore((state) => [
    state.lastCompleted,
    state.trainingLogs,
    state.scheduler,
  ]);
  return (
    <div
      onClick={() => Actions.changePage("logs")}
      style={{ cursor: "pointer" }}
    >
      {TrainingLog.getMinutesToday(logs).toFixed(2)}/
      {scheduler.options.dailyLimit.toFixed(2)}
      {lastCompleted === DateNumber.current() && " ✓"}
    </div>
  );
}

let mountID = 0;

function App() {
  useOnMount(() => {
    const id = ++mountID;
    const services = createServices();

    function onChange(state: State, _prev: State) {
      (window as any).appState = state;
    }
    const unsubscribe = useAppStore.subscribe(onChange);

    const mountTask = call(async () => {
      console.log("start mount", id);
      await Actions.init();
      await services.startAll();
      console.log("end mount", id);
    });

    function handleTilde(e: KeyboardEvent) {
      if (e.key === "~") {
        api.openDevTools();
      }
    }
    window.addEventListener("keypress", handleTilde);

    return () => {
      window.removeEventListener("keypress", handleTilde);

      call(async () => {
        await mountTask;
        console.log("start unmount", id);
        unsubscribe();
        await Actions.deinit();
        await services.stopAll();
        console.log("end unmount", id);
      });
    };
  });

  const [page, goals, viewGoal, scheduler] = useAppStore((state) => [
    state.page,
    state.goals,
    state.goals.find((e) => e.id === state.activeTraining?.goalID),
    state.scheduler,
  ]);

  return (
    <>
      {page === "home" ? (
        <>
          <div className="flex-between">
            <div className="flex-left">
              <a
                href="#"
                title="??"
                onClick={() => Actions.changePage("about")}
              >
                <img src={"icons/icon.png"} style={{ width: "30px" }} />
              </a>
              <Space />
              <DailyLimit />
            </div>
            <div className="flex-right">
              {Scheduler.isNoDisturbMode(scheduler) && (
                <span>
                  no disturb <Space />
                </span>
              )}
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
      ) : page === "logs" ? (
        <DailyLogs />
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
