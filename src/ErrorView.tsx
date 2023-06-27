import { Actions } from "./lib/actions";

export function ErrorView({ error }: { error: Error }) {
  return (
    <div>
      {error.name + ": " + error.message}
      <h1>Oh noes, failed to load your data</h1>
      This could mean that your data is corrupted, or is in invalid format. You
      can do one of the following:
      <ul>
        <li>
          If you know JSON, you can check the file with a notepad and see what's
          wrong.{" "}
        </li>
        <li>
          Restore you data to a{" "}
          <a href="#" onClick={() => Actions.changePage("backups")}>
            backup
          </a>
        </li>
      </ul>
    </div>
  );
}
