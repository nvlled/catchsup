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
import { About } from "./About";
import { SettingsView } from "./SettingsView";
import { Space } from "./components";
import { Services } from "./lib/services";
import { api } from "./lib/api";

/*
const ps = ...

await ps.finish();
    ps.push((async () => {
      await Actions.init();
      Services.startAll();
    })());

return () => {
    await ps.finish()
    console.log("unmounted");
    ps.push(...)
}
*/

let initialized = false;
function App() {
  useOnMount(() => {
    console.log("mounted");

    (async () => {
      if (!initialized) {
        initialized = true;
        await Actions.init();
        Services.startAll();
      }
    })();

    function handleTilde(e: KeyboardEvent) {
      if (e.key === "~") {
        api.openDevTools();
      }
    }
    window.addEventListener("keypress", handleTilde);

    return () => {
      console.log("unmounted");
      window.removeEventListener("keypress", handleTilde);

      //Actions.deinit();
      //Services.stopAll();
    };
  });

  const [page, goals, viewGoal] = useAppStore((state) => [
    state.page,
    state.goals,
    state.goals.find((e) => e.id === state.activeTraining?.goalID),
  ]);

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
