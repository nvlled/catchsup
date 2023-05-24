import { os } from "@neutralinojs/lib";
import { GoalDueState } from "./goal";

//let intervalID: NodeJS.Timer | undefined = undefined;
const baseIconPath = "/react-src/public/icons/";

export const tray = {
  icon: "",
  menuItems: [
    { id: "show-window", text: "Show window" },
    { id: "quit", text: "Quit" },
  ],
};

export const iconNames = {
  "due-now": "/icons/due-now.png",
  "due-later": "/icons/due-later.png",
  "was-due": "/icons/was-due.png",
  "time-up": "/icons/time-tup.png",
  ongoing: "/icons/ongoing.png",
  blank: "",
};
export type IconName = keyof typeof iconNames;

export const Systray = {
  //loopInterval: 2000,

  async setIcon(name: IconName) {
    const iconPath = baseIconPath + name + ".png";
    if (iconPath !== tray.icon) {
      tray.icon = iconPath;
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
