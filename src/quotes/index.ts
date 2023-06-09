import data from "./data.json";

export interface Quote {
  text: string;
  from: string;
}

export function getRandomQuote(): Quote {
  const i = Math.floor(data.length * Math.random());
  return data[i];
}
