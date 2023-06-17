import { create } from "zustand";
import { Goal, GoalID, TrainingLog, ActiveTraining } from "../../shared/goal";
import { createJSONStorage, persist } from "zustand/middleware";
import { NeuStorage } from "./storage";
import { UnixTimestamp } from "../../shared/datetime";
import { storageName } from "../../shared";
import { Scheduler } from "../../shared/scheduler";

export type AppPage =
  | "home"
  | "create-goal"
  | "view-goal"
  | "training"
  | "settings"
  | "about";

interface TransientState {
  page: AppPage;
  scheduler: Scheduler;

  window: {
    focused: boolean;
  };
  screen: {
    locked: boolean;
    suspended: boolean;
  };
}
interface PersistentState {
  activeTraining: ActiveTraining;
  // TODO: remove
  lastNotification: UnixTimestamp | null;
  lastGoalFinish: UnixTimestamp | null;

  goals: Goal[];
  trainingLogs: TrainingLog[];
  nextGoalID: GoalID;
}

export type State = TransientState & PersistentState;

export const useAppStore = create<State>()(
  persist(
    () =>
      ({
        page: "home",
        activeTraining: null,
        lastNotification: null,
        lastGoalFinish: null,
        scheduler: Scheduler.create(),

        window: { focused: false },
        screen: { locked: false, suspended: false },

        goals: [],
        trainingLogs: [],
        nextGoalID: 1,
      } as State),
    {
      name: storageName,
      storage: createJSONStorage(() => NeuStorage),
      partialize: (state) => {
        const s: PersistentState = {
          activeTraining: state.activeTraining,
          goals: state.goals,
          trainingLogs: state.trainingLogs,
          nextGoalID: state.nextGoalID,
          lastNotification: state.lastNotification,
          lastGoalFinish: state.lastGoalFinish,
        };
        return s;
      },
    }
  )
);

export function parseState(obj: unknown): obj is State {
  if (!obj) return false;
  if (typeof obj !== "object") return false;
  if (typeof obj !== "object") return false;
  if (!("goals" in obj)) return false;
  if (!("trainingLogs" in obj)) return false;
  if (!Array.isArray(obj.goals)) return false;
  if (!Array.isArray(obj.trainingLogs)) return false;

  return true;
}
