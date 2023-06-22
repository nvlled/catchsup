import { Actions } from "../actions";

export function createWindowStateChecker() {
  return { start, stop };

  function start() {
    window.addEventListener("focus", onfocus);
    window.addEventListener("blur", onBlur);
  }
  function stop() {
    window.removeEventListener("focus", onfocus);
    window.removeEventListener("blur", onBlur);
  }
  function onBlur() {
    Actions.produceNextState((draft) => {
      draft.window.focused = false;
    });
  }
  function onfocus() {
    Actions.produceNextState((draft) => {
      draft.window.focused = true;
    });
  }
}
