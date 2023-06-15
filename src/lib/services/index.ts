import { ActiveTrainingChecker } from "./active-training-checker";
import { GoalChecker } from "./goal-checker";
import { SchedulerService } from "./scheduler-service";
import { ScreenChecker } from "./screen-checker";
import { WindowStateChecker } from "./window-checker";

interface Service {
  start(): void;
  stop(): void;
}

const services: Service[] = [
  GoalChecker,
  WindowStateChecker,
  ActiveTrainingChecker,
  ScreenChecker,
  SchedulerService,
];

export const Services = {
  startAll() {
    for (const s of services) {
      s.start();
    }
  },

  stopAll() {
    for (const s of services) {
      s.stop();
    }
  },
};
