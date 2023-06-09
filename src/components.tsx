import React from "react";
import { ArrayUtil } from "./lib/util";

export function Space({ count }: { count?: number }) {
  return (
    <span>
      {ArrayUtil.range(1, count ?? 1).map((i) => (
        <React.Fragment key={i}>&nbsp;</React.Fragment>
      ))}
    </span>
  );
}
