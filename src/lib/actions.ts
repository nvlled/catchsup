import { produce } from "immer";
import {
  ForwardSlashPath,
  backupDirName,
  logsDirName,
  storageName,
} from "../../shared";
import { DateNumber, Minutes, UnixTimestamp } from "../../shared/datetime";
import { Goal, GoalID, TrainingLog } from "../../shared/goal";
import { Scheduler } from "../../shared/scheduler";
import { sleep } from "../common";
import {
  AppPage,
  useAppStore,
  parseState,
  State,
  ensureValidState,
  getPersistentState,
} from "./state";
import { Audios } from "./audios";
import { AppEvent } from "./app-event";
import { storage } from "./storage";
import { createFnMux } from "./fn-mux";
import { api } from "./api";
import { Logs } from "./logs";
import { ArrayUtil } from "./jsext";

const errNoDataFile = new Error("no data file found");

const saveStorage = createFnMux(async () => {
  console.log("saving data", new Date().toLocaleTimeString());
  const data = getPersistentState(useAppStore.getState());
  await storage.setItem(storageName, JSON.stringify(data));
}, 10 * 1000);

export const Actions = {
  changePage(newPage: AppPage) {
    useAppStore.setState({ page: newPage });
  },

  async init() {
    let persistentData = await Actions.loadData();

    if (isError(persistentData)) {
      const err = persistentData;
      if (err != errNoDataFile) {
        console.log("error", err);
        return [err];
      }

      persistentData = State.createWithSampleGoals();
    }

    if (persistentData) {
      if (!persistentData?.scheduler) {
        persistentData.scheduler = Scheduler.create();
      }

      const [logs, errs] = await Logs.readAll(
        persistentData.goals.map((g) => g.id)
      );
      if (errs != null) {
        return errs;
      }

      persistentData.trainingLogs = logs.map((l) => ({
        goalID: l.goalID,
        startTime: l.startTime,
        elapsed: l.elapsed,
      }));

      useAppStore.setState({
        ...persistentData,
      });
    }

    const { activeTraining } = useAppStore.getState();
    if (activeTraining?.startTime) {
      Actions.changePage("training");
    }

    console.log("initialized");
    return null;
  },

  async deinit() {
    // empty
  },

  async loadData(): Promise<State | Error | null> {
    if (!(await storage.hasItem(storageName))) {
      console.log("no data file found");
      return errNoDataFile;
    }

    try {
      const str = await storage.getItem(storageName);
      if (!str) {
        console.log("empty data file found");
        return null;
      }

      const obj = JSON.parse(str);
      if (!parseState(obj)) {
        console.log("cannot parse state", obj);
        return null;
      }
      return ensureValidState(obj);
    } catch (e) {
      console.log("failed to parse app data", e);
      if (isError(e)) {
        return e;
      }
      return new Error("failed to parse data");
    }
  },

  save: saveStorage,

  produceNextState(producer: (draft: State) => void) {
    useAppStore.setState((state) => {
      return produce(state, producer);
    });
  },

  deleteGoal(goal: Goal) {
    Actions.produceNextState((draft) => {
      const i = draft.goals.findIndex((g) => g.id === goal.id);
      draft.goals.splice(i, 1);
      const store = useAppStore.getState();
      if (store.activeTraining?.goalID === goal.id) {
        draft.page = "home";
      }
    });
    Actions.save();
  },

  modifyGoal(goal: Goal) {
    Actions.produceNextState((draft) => {
      const index = draft.goals.findIndex((e) => e.id === goal.id);
      if (index >= 0) {
        draft.goals[index] = goal;
      }
    });
    Actions.save();

    AppEvent.dispatch("goal-modified", goal.id);
  },

  cancelGoalTraining(goal: Goal) {
    Actions.produceNextState((draft) => {
      draft.page = "view-goal";
      draft.activeTraining = { goalID: goal.id };
    });
    Actions.save();

    AppEvent.dispatch("goal-cancelled", goal.id);
  },

  startGoalTraining(goal: Goal) {
    Actions.produceNextState((draft) => {
      draft.page = "training";
      draft.activeTraining = {
        goalID: goal.id,
        startTime: UnixTimestamp.current(),
        silenceNotification: false,
        cooldownDuration: goal.overtime,
      };
    });
    Actions.save();

    AppEvent.dispatch("goal-started", goal.id);
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
    let startTime = UnixTimestamp.current();
    Actions.produceNextState((draft) => {
      const { activeTraining } = draft;
      if (!activeTraining?.startTime) return;

      startTime = activeTraining.startTime;

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
        elapsed: elapsed as Minutes,
        startTime: activeTraining.startTime,
      });

      const minutes = TrainingLog.getMinutesToday(draft.trainingLogs);
      draft.lastCompleted =
        minutes >= draft.scheduler.options.dailyLimit
          ? DateNumber.current()
          : null;
    });
    Actions.save();

    Logs.append({
      goalID: goal.id,
      elapsed: elapsed as Minutes,
      startTime: startTime,
      notes,
    });

    AppEvent.dispatch("goal-finished", goal.id);
  },

  createGoal(goal: Goal) {
    Actions.produceNextState((draft) => {
      const id = draft.nextGoalID + 1;
      draft.nextGoalID = draft.nextGoalID + 1;
      goal = produce(goal, (goalDraft) => {
        goalDraft.id = id;
      });
      draft.goals.push(goal);
    });
  },

  updateNoteLog(goalID: GoalID, t: UnixTimestamp, notes: string) {
    const state = useAppStore.getState();
    const i = state.trainingLogs.findIndex(
      (g) => g.goalID === goalID && g.startTime === t
    );
    if (i >= 0) {
      const log = { ...state.trainingLogs[i], notes };
      Logs.update(log);
    }
  },

  scheduleNext() {
    Actions.produceNextState((draft) => {
      const { scheduler, goals } = draft;
      scheduler.goal = Scheduler.findNextSchedule(scheduler, goals);
    });
  },
  scheduleRandom() {
    Actions.produceNextState((draft) => {
      const dues = draft.goals.filter(Goal.isDueToday);
      if (dues.length > 0) {
        draft.scheduler.goal = {
          id: ArrayUtil.randomSelect(dues).id,
          scheduledOn: UnixTimestamp.current(),
        };
      }
    });
  },

  /*
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
  */

  goalTimeUp() {
    Actions.produceNextState((draft) => {
      if (draft.activeTraining) {
        draft.activeTraining.timeUp = UnixTimestamp.current();
      }
    });
  },

  toggleGoalList() {
    Actions.produceNextState((draft) => {
      draft.goalList.hideGoalList = !draft.goalList.hideGoalList;
    });
  },

  setNoDisturb(time: UnixTimestamp) {
    Actions.produceNextState((draft) => {
      draft.scheduler.noDisturbUntil = time;
    });
    AppEvent.dispatch("settings-updated");
  },

  cancelNoDisturb() {
    Actions.produceNextState((draft) => {
      draft.scheduler.noDisturbUntil = null;
    });
    AppEvent.dispatch("settings-updated");
  },

  setDailyLimit(limit: Minutes) {
    Actions.produceNextState((draft) => {
      const minutes = TrainingLog.getMinutesToday(draft.trainingLogs);
      draft.lastCompleted = minutes >= limit ? DateNumber.current() : null;
      draft.scheduler.options.dailyLimit = limit;
    });
  },

  async createDataBackup() {
    const destDataFile = await api.withAbsoluteDataDir(
      `${backupDirName}/${storageName}` as ForwardSlashPath
    );
    const srcLogDir = await api.withAbsoluteDataDir(logsDirName);
    const destLogDir = await api.withAbsoluteDataDir(backupDirName);

    console.log({ destDataFile, srcLogDir, destLogDir });

    const data = getPersistentState(useAppStore.getState());
    await api.atomicWriteFile(destDataFile, JSON.stringify(data));
    Actions.produceNextState((draft) => {
      draft.backup.lastBackup = UnixTimestamp.current();
    });

    await api.copyFiles(srcLogDir, destLogDir);
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

function isError(x: unknown): x is Error {
  if (!x) return false;
  if (typeof x !== "object") return false;
  if (!("name" in x)) return false;
  if (!("message" in x)) return false;
  return true;
}
