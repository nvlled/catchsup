import { useState } from "react";
import { Actions } from "./lib/actions";
import { useOnMount } from "./lib/reactext";
import { api } from "./lib/api";
import { call } from "./lib/jsext";

export function About() {
  const [version, setVersion] = useState("");
  useOnMount(() => {
    call(async () => {
      setVersion(await api.version());
    });
  });

  return (
    <div>
      <div className="flex-right">
        <button onClick={() => Actions.changePage("home")}>back</button>
      </div>
      <h1>
        Catchsup <small>{version}</small>
      </h1>
      <div>
        <em>Note: this is an experimental WIP software.</em>
      </div>
      <hr />
      <p>Catchsup is a tool to help you to learn a new habit or skill.</p>
      <p>
        Do you ever find yourself wishing that you have discipline and spare
        time to do things, like
      </p>
      <ul>
        <li>reading a book</li>
        <li>learning to draw</li>
        <li>playing in instrument.</li>
      </ul>
      <p>
        Good news, you may actually have the time! You just may find it hard to
        start due numerous reasons, but you don't need discipline for that. All
        you need is to build a habit of doing it.
      </p>
      <h2>How to use</h2>
      <ol>
        <li>
          <b>Pick something to do</b>
          <br />
          It can be anything, but it must be a goal that you:
          <ul>
            <li>want really to do</li>
            <li>can't find time for</li>
            <li>find difficult to start and do consistently</li>
            <li>don't already do regularly</li>
            <li>don't consider that essential</li>
          </ul>
        </li>
        <li>
          <b>Put a title and a description.</b>
          <br />
          What it says. The description is anything that could be related to a
          goal, something to keep in mind, or constraints you set for your self.
        </li>
        <li>
          <b>(optional) Pick what days to it</b>
          <br />
          Pick which days you want to do this. It could be every monday and
          tuesdays. Or once a month. Or every other day. Pick whatever you are
          comfortable with. You can always change this later when the schedule
          feels too light or heavy.
          <br />
          Any day is fine too, the program will pick an available day for you.
        </li>
        <li>
          <b>(optional) Pick what time to it</b>
          <br />
          You can set the particular time that you want to do this. But you can
          leave the default, and let the program pick a time for you.
        </li>
        <li>
          <b>Set a duration</b>
          <br />
          Duration is how long you want to do the task for each scheduled day.
          It could be 15 minutes, or an hour. But when you are just beginning,
          it's important to have a minimal duration, ideally 15 minutes. You can
          gradually increase this as you feel more comfortable doing it.
        </li>
        <li>
          <b>Done</b>
          <br />
          Now you just let the application notify you when you need to start.
        </li>
      </ol>
      <h2>Things to keep in mind</h2>
      <p>Start small. Be consistent.</p>
      <p>Stop preparing, Start doing.</p>
      <p>Do the bare minimum.</p>
      <p>Forget productivity, forget results.</p>
      <p>Play around, fool around</p>
      <p>Get started</p>
      <hr />
    </div>
  );
}
