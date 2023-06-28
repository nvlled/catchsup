import { createActiveTrainingChecker } from "./active-training-checker";
import { createSchedulerService } from "./scheduler-service";
import { createScreenChecker } from "./screen-checker";
import { createWindowStateChecker } from "./window-checker";
import { createBackupService } from "./backup-service";

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
    createBackupService(),
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
        await s.stop();
      }
    },
  };
}
