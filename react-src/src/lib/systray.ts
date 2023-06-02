import { os } from "@neutralinojs/lib";
import { GoalDueState } from "./goal";

//let intervalID: NodeJS.Timer | undefined = undefined;
const baseIconPath = "/react-src/dist";

const tray = {
  icon: "",
  menuItems: [
    { id: "show-window", text: "Show window" },
    { id: "quit", text: "Quit" },
  ],
};

export const iconNames = {
  "due-now": baseIconPath + "/icons/due-now.png",
  "due-later": baseIconPath + "/icons/due-later.png",
  "was-due": baseIconPath + "/logo.png",
  "time-up": baseIconPath + "/icons/time-up.png",
  ongoing: baseIconPath + "/icons/ongoing.png",
  blank: baseIconPath + "/logo.png",
};
export type IconName = keyof typeof iconNames;

export const Systray = {
  async setIcon(name: IconName) {
    const iconPath = iconNames[name];
    if (iconPath && iconPath !== tray.icon) {
      tray.icon = iconPath;
      //tray.icon = iconNames["blank"]
      console.log("set systray icon", tray.icon);
      await os.setTray(tray);
    }
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
