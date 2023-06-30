import { create } from "zustand";
import {
  Goal,
  GoalID,
  TrainingLog,
  ActiveTraining,
  createExampleGoals,
} from "../../shared/goal";
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
  trainingLogs: TrainingLog[];
}

export interface PersistentState {
  activeTraining: ActiveTraining;

  goals: Goal[];
  nextGoalID: GoalID;
  lastCompleted: DateNumber | null | undefined;

  backup: {
    lastBackup: UnixTimestamp | null;
  };

  scheduler: Scheduler;
}

export type State = TransientState & PersistentState;

export const State = {
  create: (): State => ({
    page: "home",
    activeTraining: null,
    scheduler: Scheduler.create(),
    goalList: { hideGoalList: true },
    lastCompleted: null,

    window: { focused: false },
    screen: { locked: false, suspended: false },

    backup: {
      lastBackup: null,
    },

    goals: [],
    trainingLogs: [],
    nextGoalID: 1,
  }),

  createWithSampleGoals() {
    const state = State.create();
    const nextGoalID = 1;
    state.goals = createExampleGoals(nextGoalID);
    state.nextGoalID = nextGoalID + state.goals.length;
    return state;
  },
};

export function getPersistentState(state: State): PersistentState {
  return {
    activeTraining: state.activeTraining,
    goals: state.goals,
    nextGoalID: state.nextGoalID,
    lastCompleted: state.lastCompleted,
    scheduler: state.scheduler,
    backup: state.backup,
  };
}

export function ensureValidState(state: State) {
  if (!state.scheduler) {
    state.scheduler = Scheduler.create();
  }
  if (!state.backup) {
    state.backup = {
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
  if (!Array.isArray(obj.goals)) return false;

  return true;
}

export const useAppStore = create<State>()(State.create);
