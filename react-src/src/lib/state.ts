import { create } from "zustand";
import { debug, events, os, storage } from "@neutralinojs/lib";
import {
  Goal,
  GoalID,
  GoalDueState,
  TrainingLog,
  ActiveTraining,
} from "./goal";
import { isNeuError } from "./neutralinoext";
import { createJSONStorage, persist } from "zustand/middleware";
import { NeuStorage } from "./storage";
import { produce } from "immer";
import { UnixTimestamp } from "./datetime";
import { Howl } from "howler";
import { sleep } from "../common";

const storageName = "catchsup-data";

export const useAppStore = create<State>()(
  persist(
    () =>
      ({
        page: "home",
        activeTraining: null,
        window: { focused: false },

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

const AudioPlayer = {
  testAudio: null as HTMLAudioElement | null,
  load() {
    //const audio = document.createElement("audio");
    //audio.controls = true;
    //audio.src = "happy.mp3";
    //document.appendChild(audio);
  },
  play() {
    AudioPlayer.testAudio?.play();
  },
};

const GoalChecker = {
  secondsFreq: 10,
  intervalID: undefined as NodeJS.Timer | undefined,
  start() {
    clearInterval(GoalChecker.intervalID);
    GoalChecker.intervalID = setInterval(
      GoalChecker.updateDueGoals,
      GoalChecker.secondsFreq * 1000
    );
  },

  updateDueGoals() {
    const dueStates: Record<GoalID, GoalDueState> = {};
    let hasDueNow = false;

    const state = useAppStore.getState();
    for (const goal of state.goals) {
      dueStates[goal.id] = Goal.checkDue(goal);
      if (dueStates[goal.id] === "due-now") {
        hasDueNow = true;
      }
    }

    useAppStore.setState({
      dueStates,
    });

    if (hasDueNow && !state.activeTraining) {
      debug.log("has due now");
      const focused = useAppStore.getState().window.focused;
      console.log({ focused });
      if (!focused) {
        os.showNotification("oi", "you got stuffs to do", os.Icon.QUESTION);
      }
    }
  },

  stop() {
    clearInterval(GoalChecker.intervalID);
  },
};
const WindowStateChecker = {
  start() {
    events.on("windowFocus", WindowStateChecker.onfocus);
    events.on("windowBlur", WindowStateChecker.onBlur);
  },
  stop() {
    events.off("windowFocus", WindowStateChecker.onfocus);
    events.off("windowBlur", WindowStateChecker.onBlur);
  },
  onBlur() {
    Actions.produceNextState((draft) => {
      draft.window.focused = false;
    });
    console.log("blur");
  },
  onfocus() {
    Actions.produceNextState((draft) => {
      draft.window.focused = true;
    });
  },
};

const ActiveTrainingChecker = {
  intervalID: undefined as NodeJS.Timer | undefined,
  start() {
    clearInterval(ActiveTrainingChecker.intervalID);
    ActiveTrainingChecker.intervalID = setInterval(() => {
      const { activeTraining, goals, window } = useAppStore.getState();
      if (window.focused) return;
      if (!activeTraining?.startTime) return;
      if (activeTraining?.silenceNotification) return;

      const goal = goals.find((g) => g.id === activeTraining.goalID);
      if (!goal) return;

      if (!Goal.isTrainingDone(goal, activeTraining)) {
        return;
      }

      os.showNotification("done", goal.title, os.Icon.QUESTION);
    }, 5000);
  },
  stop() {
    clearInterval(ActiveTrainingChecker.intervalID);
  },
};

export type AppPage = "home" | "create-goal" | "view-goal" | "training";

interface TransientState {
  page: AppPage;
  dueStates?: Record<GoalID, GoalDueState>;

  window: {
    focused: boolean;
  };
}

export type State = TransientState & {
  activeTraining: ActiveTraining;

  goals: Goal[];
  trainingLogs: TrainingLog[];
  nextGoalID: GoalID;
};

export const Actions = {
  changePage(newPage: AppPage) {
    useAppStore.setState({ page: newPage });
  },

  async init() {
    const data = await Actions.load();

    if (data) {
      useAppStore.setState({
        ...data,
      });
    }

    GoalChecker.start();
    WindowStateChecker.start();
    ActiveTrainingChecker.start();

    GoalChecker.updateDueGoals();

    const { activeTraining } = useAppStore.getState();
    if (activeTraining?.startTime) {
      Actions.changePage("training");
    }

    console.log("initialized");
  },

  async deinit() {
    GoalChecker.stop();
    WindowStateChecker.stop();
    ActiveTrainingChecker.stop();
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

  produceNextState(producer: (draft: State) => void) {
    useAppStore.setState((state) => {
      return produce(state, producer);
    });
  },

  save() {
    const data = useAppStore.getState();
    storage.setData(storageName, JSON.stringify(data));
  },

  deleteGoal(goal: Goal) {
    Actions.produceNextState((draft) => {
      const i = draft.goals.findIndex((g) => g.id === goal.id);
      draft.goals.splice(i, 1);
      if (draft.activeTraining?.goalID === goal.id) {
        draft.page = "home";
      }
    });
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

  cancelGoalTraining() {
    Actions.produceNextState((draft) => {
      draft.page = "home";
      draft.activeTraining = null;
    });
  },

  startGoalTraining(goal: Goal) {
    Actions.produceNextState((draft) => {
      draft.page = "training";
      draft.activeTraining = {
        goalID: goal.id,
        startTime: UnixTimestamp.current(),
        silenceNotification: false,
      };
    });
  },

  toggleActiveTrainingNotifications() {
    Actions.produceNextState((draft) => {
      const { activeTraining: training } = draft;
      if (training) {
        training.silenceNotification = !training.silenceNotification;
      }
    });
  },

  finishGoalTraining(goal: Goal, elapsed: number, notes?: string) {
    GoalChecker.updateDueGoals();
    Actions.produceNextState((draft) => {
      const { activeTraining } = draft;
      if (!activeTraining?.startTime) return;

      const i = draft.goals.findIndex((g) => g.id === goal.id);
      if (i >= 0) {
        draft.goals[i] = produce(goal, (draft) => {
          Goal.recordTraining(draft);
        });
      }

      draft.page = "home";
      draft.activeTraining = null;
      draft.trainingLogs.push({
        goalID: goal.id,
        elapsed,
        startTime: activeTraining.startTime,
        notes,
      });
    });
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
  },

  playPromptSound() {
    const sound = new Howl({
      src: ["happy.mp3"],
    });

    (async function () {
      const duration = 10 * 1000;
      sound.play();
      sound.fade(1, 0, duration);
      await sleep(duration);
      sound.stop();
    })();

    return sound;
  },

  playRewardSound() {
    const sound = new Howl({
      src: ["reward.mp3"],
    });

    (async function () {
      const duration = 15 * 1000;
      sound.seek(3);
      sound.play();
      sound.fade(1, 0, duration);
      await sleep(duration);
      sound.stop();
    })();

    return sound;
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
