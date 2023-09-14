import "normalize.css";
import "./styles/layout.css";
import "./styles/App.css";

import { useOnMount } from "./lib/reactext";
import GoalList from "./GoalList";
import { PersistentState, State, useAppStore } from "./lib/state";
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
import { DateNumber, UnixTimestamp } from "../shared/datetime";
import { DailyLogs } from "./DailyLogs";
import { ErrorView } from "./ErrorView";
import { BackupsView } from "./BackupsView";
import { typecheckMissedFields } from "../shared/assert";
import { identityFn } from "../shared";

function DailyLimit() {
  const [lastCompleted, logs, scheduler] = useAppStore((state) => [
    state.lastCompleted,
    state.trainingLogs,
    state.scheduler,
  ]);
  return (
    <div
      title="hours done / hourly limit"
      onClick={() => Actions.changePage("logs")}
      style={{ cursor: "pointer" }}
    >
      {TrainingLog.getMinutesToday(logs).toFixed(2)}/
      {scheduler.options.dailyLimit.toFixed(2)}
      {lastCompleted === DateNumber.current() && " ✓"}
    </div>
  );
}

function NoDisturb() {
  const scheduler = useAppStore((state) => state.scheduler);
  const { noDisturb } = scheduler;

  if (!Scheduler.hasScheduledGoal(scheduler)) {
    return null;
  }

  return (
    <div className="no-disturb-buttons">
      no disturb for
      {!scheduler.noDisturb.until ? (
        [1, 2, 5, 15, 30, 60, 120].map((val) =>
          noDisturb.selections.includes(val) ? null : (
            <button key={val} onClick={() => handleSetNoDisturb(val)}>
              {val < 60 ? `${val}m` : `${(val / 60).toFixed(1)}h`}
            </button>
          )
        )
      ) : (
        <>
          <Space />
          {((scheduler.noDisturb.until - UnixTimestamp.current()) / 60).toFixed(
            2
          )}
          min
          <button onClick={() => Actions.cancelNoDisturb()}>x</button>
        </>
      )}
    </div>
  );

  function handleSetNoDisturb(minutes: number) {
    Actions.setNoDisturb(minutes);
  }
}

let mountID = 0;
let startupErrors: Error[] | null;

function App() {
  useOnMount(() => {
    const id = ++mountID;
    const services = createServices();

    let unsubscribe = identityFn;

    const mountTask = call(async () => {
      console.log("start mount", id);

      startupErrors = await Actions.init();
      if (!startupErrors) {
        await services.startAll();
      }

      unsubscribe = useAppStore.subscribe((state: State, prev: State) => {
        let modified = false;
        for (const k of Object.keys(state)) {
          const name = k as keyof PersistentState;
          switch (name) {
            case "activeTraining":
            case "backup":
            case "goals":
            case "lastCompleted":
            case "nextGoalID":
            case "scheduler": {
              if (state[name] !== prev[name]) {
                modified = true;
              }
              break;
            }
            default:
              typecheckMissedFields(name);
          }
        }

        if (modified) {
          Actions.save({ waitInterval: true });
        }
      });

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

  const [page, goals, viewGoal] = useAppStore((state) => [
    state.page,
    state.goals,
    state.goals.find((e) => e.id === state.activeTraining?.goalID),
    state.scheduler,
  ]);

  return (
    <>
      {startupErrors ? (
        <ErrorView errors={startupErrors} />
      ) : page === "home" ? (
        <>
          <div className="flex-between">
            <div className="flex-left">
              <a
                className="logo"
                href="#"
                title="??"
                onClick={() => Actions.changePage("about")}
              >
                <img src={"icons/icon.png"} style={{ width: "30px" }} />
              </a>
              <Space count={3} />
              <DailyLimit />
            </div>
            <div className="flex-right">
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
          <NoDisturb />
        </>
      ) : page === "backups" ? (
        <BackupsView />
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
    </>
  );

  function handleGoalCreate() {
    Actions.changePage("home");
  }
}

export default App;
