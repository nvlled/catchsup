import { api } from "./api";
import { GoalDueState } from "./goal";

//let intervalID: NodeJS.Timer | undefined = undefined;

export const Systray = {
  async setIcon(name: string) {
    api.setTray(name);
  },

  async setIconByDueState(state: GoalDueState) {
    let icon = "blank";
    switch (state) {
      case "due-now":
        icon = "due-now";
        break;
      case "was-due":
        icon = "was-due";
        break;
      case "due-later":
        icon = "due-later";
        break;
    }
    await Systray.setIcon(icon);
  },

  //start() {
  //  intervalID = setInterval(loop, Systray.loopInterval);
  //  AppEvent.on("goal-started", onGoalStart);
  //},

  //stop() {
  //  clearInterval(intervalID);
  //  AppEvent.off("goal-started", onGoalStart);
  //},
};

//function loop() {}
//
//function onGoalStart(e: CustomEvent<number>) {
//  Systray.setIcon("");
//}
