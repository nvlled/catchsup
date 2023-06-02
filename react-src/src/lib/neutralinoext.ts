export type ErrorCode =
  | "NE_FS_DIRCRER"
  | "NE_FS_RMDIRER"
  | "NE_FS_FILRDER"
  | "NE_FS_FILWRER"
  | "NE_FS_FILRMER"
  | "NE_FS_NOPATHE"
  | "NE_FS_COPYFER"
  | "NE_FS_MOVEFER"
  | "NE_OS_INVMSGA"
  | "NE_OS_INVKNPT"
  | "NE_ST_INVSTKY"
  | "NE_ST_STKEYWE"
  | "NE_ST_NOSTKEX"
  | "NE_RT_INVTOKN"
  | "NE_RT_NATPRME"
  | "NE_RT_APIPRME"
  | "NE_RT_NATRTER"
  | "NE_RT_NATNTIM"
  | "NE_CL_NSEROFF"
  | "NE_EX_EXTNOTC"
  | "NE_UP_CUPDMER"
  | "NE_UP_CUPDERR"
  | "NE_UP_UPDNOUF"
  | "NE_UP_UPDINER";

export interface NeuError {
  code: ErrorCode;
  message: string;
}

export function isNeuError(e: unknown): e is NeuError {
  if (!e) return false;
  if (typeof e !== "object") return false;
  if (!("code" in e)) return false;
  if (!("message" in e)) return false;
  if (typeof e.code !== "string") return false;
  if (typeof e.message !== "string") return false;

  return true;
}

export type Action = () => void