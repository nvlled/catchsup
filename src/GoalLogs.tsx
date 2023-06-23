import "./styles/GoalLogs.css";

import { marked } from "marked";
import { useRef, useState } from "react";
import { Space } from "./components";
import { UnixTimestamp } from "../shared/datetime";
import { Goal, GoalID, TrainingLog } from "../shared/goal";
import { produce } from "immer";
import { Actions } from "./lib/actions";

export function GoalLogs({
  goals,
  logs,
}: {
  goals?: Goal[];
  logs: TrainingLog[];
}) {
  const [shownIDs, setShownIDs] = useState(new Set<number>());
  const [editEntry, setEditEntry] = useState<UnixTimestamp | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const goalMap = Object.fromEntries(goals?.map((g) => [g.id, g]) ?? []);

  logs = [...logs].reverse();

  return (
    <div className="goal-logs">
      {logs.map((e) => {
        // TODO: better if I use an ID, but startTime will do for now
        // since it's at least guaranteed unique per log entry
        const shown = shownIDs.has(e.startTime);
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
              {goalMap && <span>{goalMap[e.goalID]?.title}</span>}
              <Space />[{d.toLocaleDateString()} {d.toLocaleTimeString()}
              ]
              <Space />
              {e.elapsed?.toFixed(0)} minutes
              <Space />
              {editEntry !== e.startTime && (
                <button onClick={() => handleShowMore(e.startTime)}>
                  {shown ? "less" : "more"}
                </button>
              )}
            </span>
            {editEntry === e.startTime ? (
              <div>
                <textarea
                  key={editEntry}
                  defaultValue={e.notes ?? ""}
                  ref={textareaRef}
                />
              </div>
            ) : e.notes ? (
              <div className="goal-log-contents">
                <div
                  dangerouslySetInnerHTML={{
                    __html: html,
                  }}
                />
              </div>
            ) : null}
            {shown && (
              <>
                {editEntry && editEntry === e.startTime ? (
                  <div className="flex-between">
                    <button
                      onClick={() => handleSaveEdit(e.goalID, e.startTime)}
                    >
                      save
                    </button>
                    <button onClick={() => handleCancelEdit(e.startTime)}>
                      cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleStartEdit(e.startTime)}>
                    edit
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  function handleStartEdit(id: UnixTimestamp) {
    setEditEntry(id);
  }
  function handleSaveEdit(goalID: GoalID, t: UnixTimestamp) {
    Actions.updateNoteLog(goalID, t, textareaRef.current?.value.trim() ?? "");
    setEditEntry(null);
  }
  function handleCancelEdit(_id: UnixTimestamp) {
    setEditEntry(null);
  }

  function handleShowMore(t: UnixTimestamp) {
    setShownIDs(
      produce(shownIDs, (draft) => {
        if (draft.has(t)) draft.delete(t);
        else draft.add(t);
      })
    );
  }
}