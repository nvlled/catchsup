import { Goal } from "./lib/goal";

interface Props {
  goals: Goal[];
}

export default function GoalList({ goals }: Props) {
  return (
    <div>
      {goals.map((e) => (
        <div key={e.id}>{e.title}</div>
      ))}
    </div>
  );
}
