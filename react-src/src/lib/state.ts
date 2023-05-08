import { create } from "zustand";
import { os, storage } from "@neutralinojs/lib";
import { Goal, GoalID, GoalDueState, TrainingLog } from "./goal";
import { isNeuError } from "./neutralinoext";
import { createJSONStorage, persist } from "zustand/middleware";
import { NeuStorage } from "./storage";
import { produce } from "immer";

const storageName = "catchsup-data";
const GoalChecker = {
  secondsFreq: 10,
  intervalID: undefined as NodeJS.Timer | undefined,
  start() {
    clearInterval(GoalChecker.intervalID);
    GoalChecker.intervalID = setInterval(
      updateDueGoals,
      GoalChecker.secondsFreq
    );
  },
};

export type AppPage = "home" | "create-goal" | "view-goal" | "training";

interface TransientState {
  initialized: boolean;
  page: AppPage;
  dueStates?: Record<GoalID, GoalDueState>;
}

export type State = TransientState & {
  activeTraining: {
    goalID: GoalID;
    startTime?: number;
  } | null;

  goals: Goal[];
  trainingLogs: TrainingLog[];
  nextGoalID: GoalID;
};

export const useAppStore = create<State>()(
  persist(
    () =>
      ({
        initialized: false,
        page: "home",
        activeTraining: null,
        goals: [],
        trainingLogs: [],
        nextGoalID: 1,
      } as State),
    {
      name: storageName,
      storage: createJSONStorage(() => NeuStorage),
      partialize: (state) => ({
        activeTraining: state.activeTraining,
        goals: state.goals,
        trainingLogs: state.trainingLogs,
        nextGoalID: state.nextGoalID,
      }),
    }
  )
);

export const Actions = {
  changePage(newPage: AppPage) {
    useAppStore.setState({ page: newPage });
  },

  async init() {
    if (useAppStore.getState().initialized) return;
    const data = await Actions.load();

    if (data) {
      useAppStore.setState({
        ...data,
        initialized: true,
      });
    } else {
      useAppStore.setState({ initialized: true });
    }

    GoalChecker.start();

    console.log("initialized");
  },

  async load(): Promise<State | null> {
    try {
      const str = await storage.getData(storageName);
      const obj = JSON.parse(str);
      if (!parseState(obj)) return null;
      return obj;
    } catch (e) {
      if (isNeuError(e)) {
        if (e.code !== "NE_ST_NOSTKEX") {
          console.log("failed to load app data", e);
        }
      }
      return null;
    }
  },

  save() {
    const data = useAppStore.getState();
    storage.setData(storageName, JSON.stringify(data));
  },

  modifyGoal(goal: Goal) {
    useAppStore.setState((state) => ({
      goals: produce(state.goals, (draft) => {
        const index = draft.findIndex((e) => e.id === goal.id);
        if (index >= 0) {
          draft[index] = goal;
        }
      }),
    }));
  },

  createGoal(goal: Goal) {
    useAppStore.setState((state) => ({
      nextGoalID: state.nextGoalID + 1,
      goals: produce(state.goals, (draft) => {
        goal = produce(goal, (goalDraft) => {
          goalDraft.id = state.nextGoalID;
        });
        draft.push(goal);
      }),
    }));
  },

  createBasicGoal({ title, desc }: { title: string; desc: string }) {
    useAppStore.setState((state) => ({
      nextGoalID: state.nextGoalID + 1,
      goals: produce(state.goals, (draft) => {
        const newGoal = Goal.createEmpty();
        newGoal.id = state.nextGoalID;
        newGoal.title = title;
        newGoal.desc = desc;

        draft.push(newGoal);
      }),
    }));

    //useAppStore.setState((state) => ({
    //  nextGoalID: state.nextGoalID + 1,
    //  goals: [
    //    ...state.goals,
    //    {
    //      ...Goal.createEmpty(),
    //      id: state.nextGoalID,
    //      title,
    //      desc,
    //    },
    //  ],
    //}));
  },
};

function parseState(obj: unknown): obj is State {
  if (!obj) return false;
  if (typeof obj !== "object") return false;
  if (typeof obj !== "object") return false;
  if (!("goals" in obj)) return false;
  if (!("trainingLogs" in obj)) return false;
  if (!Array.isArray(obj.goals)) return false;
  if (!Array.isArray(obj.trainingLogs)) return false;

  return true;
}

function updateDueGoals() {
  const dueStates: Record<GoalID, GoalDueState> = {};
  let hasDueNow = false;
  for (const goal of useAppStore.getState().goals) {
    dueStates[goal.id] = Goal.checkDue(goal);
    if (dueStates[goal.id] === "due-now") {
      hasDueNow = true;
    }
  }

  useAppStore.setState({
    dueStates,
  });

  if (hasDueNow) {
    os.showNotification("oi", "you got stuffs to do", os.Icon.QUESTION);
  }
}
