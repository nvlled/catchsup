export function call<T>(fn: () => T) {
  return fn();
}

export function partition<T>(
  xs: T[],
  predicate: (x: T) => boolean
): [T[], T[]] {
  const result: [T[], T[]] = [[], []];
  for (const x of xs) {
    result[1 - +predicate(x)].push(x);
  }
  return result;
}
