import { ChangeEvent, useState } from "react";
import { DateNumber, UnixTimestamp } from "../shared/datetime";
import { GoalLogs } from "./GoalLogs";
import { useAppStore } from "./lib/state";
import { DateUtil } from "./lib/jsext";
import { Space } from "./components";
import { Actions } from "./lib/actions";

export function DailyLogs() {
  const [goals, logs] = useAppStore((state) => [
    state.goals,
    state.trainingLogs,
  ]);
  const [date, setDate] = useState(new Date());
  const [showAll, setShowAll] = useState(false);

  const shownLogs = showAll
    ? logs
    : logs.filter((l) =>
        DateNumber.sameDay(
          UnixTimestamp.toDateNumber(l.startTime),
          DateNumber.fromDate(date)
        )
      );

  return (
    <div>
      <div className="flex-right">
        <button onClick={() => Actions.changePage("home")}>← back</button>
      </div>
      <h2>Logs</h2>
      show logs on:{" "}
      <input
        type="date"
        value={DateUtil.toStringISO8601(date)}
        onChange={handleChangeDate}
        disabled={showAll}
      />
      <Space />
      <label>
        <input
          type="checkbox"
          checked={showAll}
          onChange={() => setShowAll(!showAll)}
        />{" "}
        show all
      </label>
      <br />
      {shownLogs.length === 0 && (
        <div>
          <br />
          <em>(nothing to show)</em>
        </div>
      )}
      <GoalLogs goals={goals} logs={shownLogs} />
    </div>
  );

  function handleChangeDate(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.value.trim()) {
      setDate(new Date(e.target.value));
    }
  }
}
