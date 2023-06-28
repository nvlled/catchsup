import { create } from "zustand";
import { Goal, GoalID, TrainingLog, ActiveTraining } from "../../shared/goal";
import { DateNumber, UnixTimestamp } from "../../shared/datetime";
import { Scheduler } from "../../shared/scheduler";

export type AppPage =
  | "home"
  | "logs"
  | "create-goal"
  | "view-goal"
  | "training"
  | "settings"
  | "error"
  | "backups"
  | "about";

export interface TransientState {
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
export interface PersistentState {
  activeTraining: ActiveTraining;

  goals: Goal[];
  trainingLogs: TrainingLog[];
  nextGoalID: GoalID;
  lastCompleted: DateNumber | null | undefined;

  backup: {
    lastBackup: UnixTimestamp | null;
    counter: number;
  };

  scheduler: Scheduler;
}

export type State = TransientState & PersistentState;

export const useAppStore = create<State>()(() => {
  const state: State = {
    page: "home",
    activeTraining: null,
    scheduler: Scheduler.create(),
    goalList: { hideGoalList: true },
    lastCompleted: null,

    window: { focused: false },
    screen: { locked: false, suspended: false },

    backup: {
      counter: 0,
      lastBackup: null,
    },

    goals: [],
    trainingLogs: [],
    nextGoalID: 1,
  };

  return state;
});

export function getPersistentState(state: State): PersistentState {
  return {
    activeTraining: state.activeTraining,
    goals: state.goals,
    trainingLogs: state.trainingLogs,
    nextGoalID: state.nextGoalID,
    lastCompleted: state.lastCompleted,
    scheduler: state.scheduler,
    backup: state.backup,
  };
}

/*
export const useAppState = create<TransientState>()(() => {
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
});

export const useAppStore = create<PersistentState>()(
  persist(
    () => {
      const state: PersistentState = {
        activeTraining: null,
        scheduler: Scheduler.create(),
        lastCompleted: null,

        goals: [],
        trainingLogs: [],
        nextGoalID: 1,
      };
      return state;
    },
    {
      name: storageName,
      storage: createJSONStorage(() => storage),
      //partialize: (state) => {
      //  const s: PersistentState = {
      //    activeTraining: state.activeTraining,
      //    goals: state.goals,
      //    trainingLogs: state.trainingLogs,
      //    nextGoalID: state.nextGoalID,
      //    lastCompleted: state.lastCompleted,
      //    scheduler: state.scheduler,
      //  };
      //  return s;
      //},
    }
  )
);
*/

export function ensureValidState(state: State) {
  if (!state.scheduler) {
    state.scheduler = Scheduler.create();
  }
  if (!state.backup) {
    state.backup = {
      counter: 0,
      lastBackup: null,
    };
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
