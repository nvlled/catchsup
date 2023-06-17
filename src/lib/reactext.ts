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

export function useTimer(ms: number) {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCounter((counter) => counter + 1);
    }, ms);
    return () => clearInterval(id);
  }, [ms]);

  return counter;
}

export function classes(...cs: (string | boolean)[]) {
  return cs.filter((c) => !!c && typeof c === "string").join(" ");
}
