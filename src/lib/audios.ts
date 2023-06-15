import { Howl } from "howler";

export const Audios = {
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
