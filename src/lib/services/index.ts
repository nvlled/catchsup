import { ActiveTrainingChecker } from "./active-training-checker";
import { SchedulerService } from "./scheduler-service";
import { ScreenChecker } from "./screen-checker";
import { WindowStateChecker } from "./window-checker";

interface Service {
  start(): void;
  stop(): void;
}

const services: Service[] = [
  WindowStateChecker,
  ActiveTrainingChecker,
  ScreenChecker,
  SchedulerService,
];

export const Services = {
  startAll() {
    console.log("starting services");
    for (const s of services) {
      s.start();
    }
  },

  stopAll() {
    console.log("stopping services");
    for (const s of services) {
      s.stop();
    }
  },
};
