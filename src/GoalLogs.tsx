import "./styles/GoalLogs.css";

import { marked } from "marked";
import { useState } from "react";
import { Space } from "./components";
import { UnixTimestamp } from "../shared/datetime";
import { TrainingLog } from "../shared/goal";
import { produce } from "immer";

export function GoalLogs({ logs }: { logs: TrainingLog[] }) {
  const [showMore, setShowMore] = useState(new Set<number>());

  return (
    <div className="goal-logs">
      {logs.map((e) => {
        const shown = showMore.has(e.startTime);
        let html = e.notes && shown ? marked.parse(e.notes) : e.notes ?? "";
        const maxlen = 250;
        const tooLong = html.length > maxlen;
        if (!shown && tooLong) {
          html = html.slice(0, maxlen) + "...";
        }
        const d = UnixTimestamp.toDate(e.startTime);
        return (
          <div
            key={e.goalID + " " + e.startTime}
            className="goal-log-note-entry"
          >
            <span className="goal-log-note-entry-date">
              <Space />[{d.toLocaleDateString()} {d.toLocaleTimeString()}
              ]
              <Space />
              {e.elapsed?.toFixed(0)} minutes
              {tooLong && (
                <button onClick={() => handleShowMore(e.startTime)}>
                  {shown ? "less" : "more"}
                </button>
              )}
            </span>

            {e.notes ? (
              <div className="goal-log-contents">
                <div
                  dangerouslySetInnerHTML={{
                    __html: html,
                  }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  function handleShowMore(t: UnixTimestamp) {
    setShowMore(
      produce(showMore, (draft) => {
        if (draft.has(t)) draft.delete(t);
        else draft.add(t);
      })
    );
  }
}
