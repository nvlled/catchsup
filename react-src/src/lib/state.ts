import { create } from "zustand";
import { storage } from "@neutralinojs/lib";
import { Goal, TrainingLog } from "./goal";
import { isNeuError } from "./neutralinoext";
import { createJSONStorage, persist } from "zustand/middleware";
import { NeuStorage } from "./storage";

const storageName = "catchsup-data";

export type AppPage = "home" | "create-goal";

export interface State {
  initialized: boolean;
  page: AppPage;
  activeTraining: {
    goalID: number;
    startTime: number;
  } | null;

  goals: Goal[];
  trainingLogs: TrainingLog[];
}

export type SerializedState = Exclude<State, "initialized" | "page">;

export const useAppStore = create<State>()(
  persist(
    () =>
      ({
        initialized: false,
        page: "home",
        activeTraining: null,
        goals: [],
        trainingLogs: [],
      } as State),
    {
      name: storageName,
      storage: createJSONStorage(() => NeuStorage),
      partialize: (state) => ({
        activeTraining: state.activeTraining,
        goals: state.goals,
        trainingLogs: state.trainingLogs,
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

  createGoal({ title, desc }: { title: string; desc: string | null }) {
    useAppStore.setState((state) => ({
      goals: [
        ...state.goals,
        {
          ...Goal.createEmpty(),
          id: state.goals.length + 1,
          title,
          desc,
        },
      ],
    }));
  },

  //getGoalsToPractice(data: State) {
  //  return data.goals.filter(Goal.isDueNow);
  //},

  //getTrainingLogs(data: State, goalID: number): TrainingLog[] {
  //  return data.trainingLogs.filter((l) => l.goalID === goalID);
  //},
};

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

/*
export type SerializedAppData = Exclude<AppData, "state">;

export const useAppStore = create<AppData>((set) => ({
  page: "home",
  activeTraining: null,
  goals: [],
  trainingLogs: [],
}));

export const AppData = {
  store: {},
  initialized: false,

  async init() {
    if (AppData.initialized) return;
    const data = await AppData.load();

    if (data) {
      useAppStore.setState(data);
    }

    AppData.initialized = true;
  },

  async load(): Promise<AppData | null> {
    try {
      const str = await storage.getData(storeKey);
      const obj = JSON.parse(str);
      if (!AppData.validate(obj)) return null;
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
    storage.setData(storeKey, JSON.stringify(data));
  },

  getGoalsToPractice(data: AppData) {
    return data.goals.filter(Goal.isDueNow);
  },

  getTrainingLogs(data: AppData, goalID: number): TrainingLog[] {
    return data.trainingLogs.filter((l) => l.goalID === goalID);
  },

  validate(obj: unknown): obj is AppData {
    if (!obj) return false;
    if (typeof obj !== "object") return false;
    if (typeof obj !== "object") return false;
    if (!("goals" in obj)) return false;
    if (!("trainingLogs" in obj)) return false;
    if (!Array.isArray(obj.goals)) return false;
    if (!Array.isArray(obj.trainingLogs)) return false;

    return true;
  },
};

*/
