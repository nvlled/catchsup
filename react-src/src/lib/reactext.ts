import React, { useEffect } from "react";

export function useOnMount(fn: React.EffectCallback) {
  useEffect(() => {
    return fn();
  }, []);
}
