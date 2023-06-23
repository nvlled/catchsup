import { create } from "zustand";
import { Goal, GoalID, TrainingLog, ActiveTraining } from "../../shared/goal";
import { createJSONStorage, persist } from "zustand/middleware";
import { NeuStorage } from "./storage";
import { DateNumber } from "../../shared/datetime";
import { storageName } from "../../shared";
import { Scheduler } from "../../shared/scheduler";

export type AppPage =
  | "home"
  | "logs"
  | "create-goal"
  | "view-goal"
  | "training"
  | "settings"
  | "about";

interface TransientState {
  page: AppPage;

  window: {
    focused: boolean;
  };
  screen: {
    locked: boolean;
    suspended: boolean;
  };
  goalList: {
    hideGoalList?: boolean;
  };
}
interface PersistentState {
  activeTraining: ActiveTraining;

  goals: Goal[];
  trainingLogs: TrainingLog[];
  nextGoalID: GoalID;
  lastCompleted: DateNumber | null | undefined;

  scheduler: Scheduler;
}

export type State = TransientState & PersistentState;

export const useAppStore = create<State>()(
  persist(
    () => {
      const state: State = {
        page: "home",
        activeTraining: null,
        scheduler: Scheduler.create(),
        goalList: { hideGoalList: true },
        lastCompleted: null,

        window: { focused: false },
        screen: { locked: false, suspended: false },

        goals: [],
        trainingLogs: [],
        nextGoalID: 1,
      };
      return state;
    },
    {
      name: storageName,
      storage: createJSONStorage(() => NeuStorage),
      partialize: (state) => {
        const s: PersistentState = {
          activeTraining: state.activeTraining,
          goals: state.goals,
          trainingLogs: state.trainingLogs,
          nextGoalID: state.nextGoalID,
          lastCompleted: state.lastCompleted,
          scheduler: state.scheduler,
        };
        return s;
      },
    }
  )
);

export function ensureValidState(state: State) {
  if (!state.scheduler) {
    state.scheduler = Scheduler.create();
  }

  return state;
}

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
