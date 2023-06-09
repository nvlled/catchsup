import { create } from "zustand";
import {
  Goal,
  GoalID,
  GoalDueState,
  TrainingLog,
  ActiveTraining,
  dueStates,
} from "./goal";
import { createJSONStorage, persist } from "zustand/middleware";
import { NeuStorage, storage } from "./storage";
import { produce } from "immer";
import { UnixTimestamp } from "./datetime";
import { Howl } from "howler";
import { sleep } from "../common";
import { Systray } from "./systray";
import { api } from "./api";
import { storageName } from "../../shared";

export type AppPage =
  | "home"
  | "create-goal"
  | "view-goal"
  | "training"
  | "settings"
  | "about";

interface TransientState {
  page: AppPage;
  dueStates: Record<GoalID, GoalDueState>;

  window: {
    focused: boolean;
  };
}
interface PersistentState {
  activeTraining: ActiveTraining;
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
        window: { focused: false },
        dueStates: {},
        lastNotification: null,
        lastGoalFinish: null,

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

const GoalChecker = {
  secondsFreq: 50,
  intervalID: undefined as NodeJS.Timer | undefined,
  start() {
    clearInterval(GoalChecker.intervalID);
    GoalChecker.intervalID = setInterval(
      GoalChecker.updateDueGoals,
      GoalChecker.secondsFreq * 1000
    );
  },

  updateDueGoals() {
    const state = useAppStore.getState();

    const dues: Goal[] = [];
    let hasDueNow = false;
    const updatedDueStates = produce(state.dueStates, (draft) => {
      for (const goal of state.goals) {
        draft[goal.id] = Goal.checkDue(goal);
        const dueState = draft[goal.id];
        hasDueNow ||= dueState === "due-now";
        if (dueState === "due-now" || dueState === "was-due") {
          dues.push(goal);
        }
      }
    });

    useAppStore.setState({
      dueStates: updatedDueStates,
    });

    if (state.activeTraining?.startTime) {
      const { activeTraining } = state;
      const goal = state.goals.find(
        (goal) => goal.id === activeTraining.goalID
      );
      if (goal && Goal.isTrainingDone(goal, state.activeTraining)) {
        Systray.setIcon("time-up");
      } else {
        Systray.setIcon("ongoing");
      }
    } else {
      Systray.setIconByDueState(Goal.checkAllDue(state.goals));
    }

    if (dues.length > 0 && !state.activeTraining?.startTime) {
      api.requestWindowAttention(true);
    }

    const lastNotif = UnixTimestamp.since(state.lastNotification);
    const lastFinish = UnixTimestamp.since(state.lastGoalFinish);
    console.log({ lastFinish, lastNotif });

    const [notifWait, finishWait] = dues.some(
      (g) => dueStates[g.id] === "due-now"
    )
      ? [5, 30]
      : [10, 40];

    if (
      dues.length > 0 &&
      !state.activeTraining?.startTime &&
      lastNotif > notifWait * 60 &&
      lastFinish > finishWait * 60
    ) {
      const focused = useAppStore.getState().window.focused;
      if (!focused) {
        const text = dues
          .slice(0, 3)
          .map((g) => "- " + g.title.slice(0, 100))
          .join("\n");

        (async function () {
          for (let i = 0; i < 20; i++) {
            const s = useAppStore.getState();
            api.showNotification(i + ": hey, got free time?", text);
            api.requestWindowAttention(true);
            Actions.playShortPromptSound();

            if (s.window.focused || hasDueNow) {
              break;
            }

            await sleep(5000);
          }

          Actions.produceNextState((draft) => {
            draft.lastNotification = UnixTimestamp.current();
          });
        })();
      }
    }
  },

  stop() {
    clearInterval(GoalChecker.intervalID);
  },
};
const WindowStateChecker = {
  start() {
    window.addEventListener("focus", WindowStateChecker.onfocus);
    window.addEventListener("blur", WindowStateChecker.onBlur);
  },
  stop() {
    window.removeEventListener("focus", WindowStateChecker.onfocus);
    window.removeEventListener("blur", WindowStateChecker.onBlur);
  },
  onBlur() {
    Actions.produceNextState((draft) => {
      draft.window.focused = false;
    });
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
    ActiveTrainingChecker.intervalID = setInterval(async () => {
      const { activeTraining, goals, window } = useAppStore.getState();
      if (!activeTraining?.startTime) return;
      if (activeTraining?.silenceNotification) return;

      const goal = goals.find((g) => g.id === activeTraining.goalID);
      if (!goal) return;

      const elapsedMin =
        (UnixTimestamp.current() - activeTraining.startTime) / 60;
      const overtime = elapsedMin > goal.trainingDuration * 1.75;
      if (window.focused && !overtime) return;

      if (!Goal.isTrainingDone(goal, activeTraining)) {
        return;
      }
      Systray.setIcon("time-up");
      api.showNotification("done", goal.title);
      api.requestWindowAttention(true);
      Actions.playShortRewardSound();
    }, 10 * 1000);
  },
  stop() {
    clearInterval(ActiveTrainingChecker.intervalID);
  },
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

    //let tray = {
    //  icon: "/react-src/public/icons/due-now.png",
    //  menuItems: [
    //    { id: "about", text: "About" },
    //    { text: "-" },
    //    { id: "quit", text: "Quit" },
    //  ],
    //};

    //os.setTray(tray);
    //await os.setTray(tray);

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
    Actions.produceNextState((draft) => {
      const index = draft.goals.findIndex((e) => e.id === goal.id);
      if (index >= 0) {
        draft.goals[index] = goal;
      }
      if (!draft.dueStates) {
        draft.dueStates = {};
      }
      draft.dueStates[goal.id] = Goal.checkDue(goal);
    });

    const { goals } = useAppStore.getState();
    Systray.setIconByDueState(Goal.checkAllDue(goals));
  },

  cancelGoalTraining() {
    Actions.produceNextState((draft) => {
      draft.page = "home";
      draft.activeTraining = null;
    });

    const { goals } = useAppStore.getState();
    Systray.setIconByDueState(Goal.checkAllDue(goals));
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

    Systray.setIcon("ongoing");
    //AppEvent.dispatch("goal-started");
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
    Actions.produceNextState((draft) => {
      const { activeTraining } = draft;
      if (!activeTraining?.startTime) return;

      const i = draft.goals.findIndex((g) => g.id === goal.id);
      if (i >= 0) {
        draft.goals[i] = produce(goal, (draft) => {
          Goal.recordTraining(draft);
        });
      }

      const dueStates: Record<GoalID, GoalDueState> = {};
      for (const goal of draft.goals) {
        dueStates[goal.id] = Goal.checkDue(goal);
      }

      draft.page = "home";
      draft.activeTraining = null;
      draft.dueStates = dueStates;
      draft.lastGoalFinish = UnixTimestamp.current();
      draft.trainingLogs.push({
        goalID: goal.id,
        elapsed,
        startTime: activeTraining.startTime,
        notes,
      });
    });

    const { goals } = useAppStore.getState();
    Systray.setIconByDueState(Goal.checkAllDue(goals));
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

  playShortPromptSound() {
    const sound = Audios.promptSoundShort;
    return sound.play();
  },
  playShortRewardSound() {
    const sound = Audios.rewardSoundShort;
    return sound.play();
  },

  playPromptSound() {
    const sound = Audios.promptSound;
    const id = sound.play();

    (async function () {
      const duration = 10 * 1000;
      sound.fade(1, 0, duration, id);
      await sleep(duration);
      sound.stop(id);
    })();

    return () => sound.stop(id);
  },

  playRewardSound() {
    const sound = Audios.rewardSound;
    const id = sound.play();

    (async function () {
      const duration = 15 * 1000;
      sound.seek(3);
      sound.fade(1, 0, duration, id);
      await sleep(duration);
      sound.stop(id);
    })();

    return () => sound.stop(id);
  },
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
export type AppEvent = "goal-started" | "goal-finished" | "goal-cancelled";

export const AppEvent = {
  dispatch(name: AppEvent, data?: unknown) {
    events.dispatch(name, data);
  },

  on(
    event: AppEvent,
    handler: (ev: CustomEvent) => void
  ): Promise<events.Response> {
    return events.on(event, handler);
  },

  off(
    event: AppEvent,
    handler: (ev: CustomEvent) => void
  ): Promise<events.Response> {
    return events.off(event, handler);
  },
};
*/

const Audios = {
  promptSound: new Howl({
    src: ["sounds/happy.mp3"],
  }),
  rewardSound: new Howl({
    src: ["sounds/reward.mp3"],
  }),

  promptSoundShort: new Howl({
    src: ["sounds/happy_cut.mp3"],
  }),
  rewardSoundShort: new Howl({
    src: ["sounds/reward_cut.mp3"],
  }),
};
