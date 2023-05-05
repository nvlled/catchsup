export type Motivator = {
  prompt: string;
  praise: string;

  // can be image or video
  rewardFiles: string[];
};

export const defaultMotivators: Motivator[] = [
  { prompt: "", praise: "", rewardFiles: [] },
];
