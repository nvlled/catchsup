import React, { useEffect, useState } from "react";

export function useOnMount(fn: React.EffectCallback) {
  useEffect(() => {
    return fn();
  }, []);
}

export function useChanged<T>(
  x: T,
  comparer?: (current: T, previous: T) => boolean
) {
  const [y, setY] = useState(x);
  const changed = comparer ? !comparer?.(x, y) : x !== y;

  if (changed) {
    setY(x);
  }

  return changed;
}
