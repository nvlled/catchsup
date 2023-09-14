/// <reference types="vite/client" />

type Handler = (cmd: IPCMainEvent) => void;
type IPCMainEventSetMessage = { type: "set-message"; arg: string };
type IPCMainEvent = IPCMainEventSetMessage;

type DistractionAPI = {
  listen: (callback: Handler) => void;
  run<T extends Command>(command: T): Promise<T>;
};

type SetWindowSpeed = {
  type: "setWindowSpeed";
  arg: [number, number];
  result: number;
};
type StopWindow = {
  type: "stopWindow";
};
type Command = SetWindowSpeed | StopWindow;
