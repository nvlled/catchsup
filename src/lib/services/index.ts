import { createActiveTrainingChecker } from "./active-training-checker";
import { createSchedulerService } from "./scheduler-service";
import { createScreenChecker } from "./screen-checker";
import { createWindowStateChecker } from "./window-checker";

interface Service {
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
}

export function createServices() {
  const services: Service[] = [
    createWindowStateChecker(),
    createActiveTrainingChecker(),
    createScreenChecker(),
    createSchedulerService(),
  ];

  return {
    async startAll() {
      console.log("starting services");
      for (const s of services) {
        await s.start();
      }
    },

    async stopAll() {
      console.log("stopping services");
      for (const s of services) {
        console.log(">", s);
        await s.stop();
      }
    },
  };
}
