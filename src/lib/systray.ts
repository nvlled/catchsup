import { api } from "./api";
import { GoalDueState } from "../../shared/goal";
import { IconName } from "../../shared/icon-names";

//let intervalID: NodeJS.Timer | undefined = undefined;

export const Systray = {
  async setIcon(name: IconName) {
    api.setTray(name);
  },

  async setIconByDueState(state: GoalDueState) {
    let icon: IconName = "blank";
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
