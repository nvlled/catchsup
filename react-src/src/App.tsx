import { useEffect, useRef } from "react";
//import reactLogo from "./assets/react.svg";
//import viteLogo from "/vite.svg";
import "./styles/App.css";
import { filesystem } from "@neutralinojs/lib";
import { useOnMount } from "./lib/reactext";
import GoalList from "./GoalList";
import { Actions, useAppStore } from "./lib/state";
import { GoalCreator } from "./GoalCreator";

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
    console.log("app mount");
    (async () => {
      await Actions.init();
    })();
  });

  const [appState, goals] = useAppStore((state) => [state.page, state.goals]);

  return (
    <>
      {appState === "home" ? (
        <>
          <button onClick={() => Actions.changePage("create-goal")}>
            add goal
          </button>
          <GoalList goals={goals} />
        </>
      ) : appState === "create-goal" ? (
        <>
          <GoalCreator />
        </>
      ) : (
        <div>invalid appstate {appState}</div>
      )}

      {/*
      <audio ref={audioRef} src="" controls />
      <button onClick={handlePlay}>play sound</button>
    */}
    </>
  );
}

export default App;
