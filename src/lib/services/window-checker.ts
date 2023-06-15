import { Actions } from "../actions";

export const WindowStateChecker = {
  start() {
    window.addEventListener("focus", WindowStateChecker.onfocus);
    window.addEventListener("blur", WindowStateChecker.onBlur);
  },
  stop() {
    window.removeEventListener("focus", WindowStateChecker.onfocus);
    window.removeEventListener("blur", WindowStateChecker.onBlur);
  },
  onBlur() {
    Actions.produceNextState((draft) => {
      draft.window.focused = false;
    });
  },
  onfocus() {
    Actions.produceNextState((draft) => {
      draft.window.focused = true;
    });
  },
};
