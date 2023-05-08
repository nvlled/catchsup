import "normalize.css";
import "./styles/layout.css";
import "./styles/App.css";

import { useOnMount } from "./lib/reactext";
import GoalList from "./GoalList";
import { Actions, useAppStore } from "./lib/state";
import GoalView from "./GoalView";
import { GoalEditor } from "./GoalEditor";

let initialized = false;

function App() {
  /*
  const audioRef = useRef<HTMLAudioElement>(null);
  const handlePlay = () => {
    audioRef?.current?.play();
  };

  useEffect(() => {
    // example code: play audio from any filename
    (async () => {
      try {
        const data = await filesystem.readBinaryFile(
          "./react-src/public/sample.mp3"
        );
        const blob = new Blob([data]);
        if (audioRef?.current) {
          audioRef.current.src = window.URL.createObjectURL(blob);
        }
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);
  */

  useOnMount(() => {
    if (initialized) return;
    console.log("app mount");

    (async () => {
      await Actions.init();
      initialized = true;
    })();
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
