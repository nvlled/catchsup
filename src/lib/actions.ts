import { produce } from "immer";
import { storageName } from "../../shared";
import { UnixTimestamp } from "../../shared/datetime";
import { Goal } from "../../shared/goal";
import { Scheduler } from "../../shared/scheduler";
import { sleep } from "../common";
import { AppPage, useAppStore, parseState, State } from "./state";
import { storage } from "./storage";
import { Audios } from "./audios";
import { SchedulerService } from "./services/scheduler-service";
import { AppEvent } from "./app-event";

export const Actions = {
  changePage(newPage: AppPage) {
    useAppStore.setState({ page: newPage });
  },

  async init() {
    const data = await Actions.load();

    if (data) {
      if (!data?.scheduler) {
        data.scheduler = Scheduler.create();
      }

      useAppStore.setState({
        ...data,
      });
    }

    const { activeTraining } = useAppStore.getState();
    if (activeTraining?.startTime) {
      Actions.changePage("training");
    }

    console.log("initialized");
  },

  async deinit() {
    // empty
  },

  async load(): Promise<State | null> {
    try {
      const str = await storage.getData(storageName);
      const obj = JSON.parse(str);
      if (!parseState(obj)) return null;
      return obj;
    } catch (e) {
      console.log("failed to parse app data", e);
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
    });

    AppEvent.dispatch("goal-modified", goal.id);

    //const { goals } = useAppStore.getState();
    //Systray.setIconByDueState(Goal.checkAllDue(goals));
  },

  cancelGoalTraining(goal: Goal) {
    Actions.produceNextState((draft) => {
      draft.page = "home";
      draft.activeTraining = null;
    });

    AppEvent.dispatch("goal-cancelled", goal.id);
    //const { goals } = useAppStore.getState();
    //Systray.setIconByDueState(Goal.checkAllDue(goals));
  },

  startGoalTraining(goal: Goal) {
    Actions.produceNextState((draft) => {
      draft.page = "training";
      draft.activeTraining = {
        goalID: goal.id,
        startTime: UnixTimestamp.current(),
        silenceNotification: false,
        cooldownDuration: goal.cooldownDuration,
      };
    });

    AppEvent.dispatch("goal-started", goal.id);
    //Systray.setIcon("ongoing");
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

      draft.page = "home";
      draft.activeTraining = null;
      draft.lastGoalFinish = UnixTimestamp.current();
      draft.trainingLogs.push({
        goalID: goal.id,
        elapsed,
        startTime: activeTraining.startTime,
        notes,
      });
    });

    AppEvent.dispatch("goal-finished", goal.id);

    //const { goals } = useAppStore.getState();
    //Systray.setIconByDueState(Goal.checkAllDue(goals));
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

  goalTimeUp() {
    Actions.produceNextState((draft) => {
      if (draft.activeTraining) {
        draft.activeTraining.timeUp = UnixTimestamp.current();
      }
    });
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

  scheduler: SchedulerService,
};
