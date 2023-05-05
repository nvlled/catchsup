import { useRef, useState } from "react";
import { Actions } from "./lib/state";
import "./styles/GoalCreator.css";

//export interface Props {}

type State =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "submitting" }
  | { type: "done" };

export function GoalCreator() {
  const [state, setState] = useState<State>({ type: "ready" });
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div>
      <div className="flex-right">
        <button className="clear" onClick={() => Actions.changePage("home")}>
          ← back
        </button>
      </div>
      <br />
      What do you want to do?
      <input ref={titleRef} placeholder="title" onChange={onInput} />
      <br />
      <br />
      Can you tell more about it?
      <textarea
        ref={descRef}
        onChange={onInput}
        placeholder="description"
        rows={5}
        cols={60}
      ></textarea>
      <br />
      <button
        onClick={handleCreate}
        disabled={!["ready", "error"].includes(state.type)}
      >
        create
      </button>
      &nbsp;
      {state.type === "error" ? (
        <span>{state.message}</span>
      ) : state.type === "done" ? (
        <span>goal created!?!?</span>
      ) : null}
    </div>
  );

  function onInput() {
    setState({ type: "ready" });
  }

  function handleCreate() {
    setState({ type: "submitting" });
    const title = titleRef.current?.value.trim();
    const desc = descRef.current?.value.trim() ?? null;

    if (!title) {
      setState({ type: "error", message: "please give a title" });
      return;
    }

    Actions.createGoal({
      title,
      desc,
    });

    setState({
      type: "done",
    });
    setTimeout(() => {
      Actions.changePage("home");
    }, 1000);
  }
}
