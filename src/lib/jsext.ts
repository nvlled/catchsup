export function call<T>(fn: () => T) {
  return fn();
}
export function callWith<A, B>(x: A, fn: (x: A) => B) {
  return fn(x);
}

export function partition<T>(
  xs: T[],
  predicate: (x: T) => boolean
): [ok: T[], nope: T[]] {
  const result: [T[], T[]] = [[], []];
  for (const x of xs) {
    result[1 - +predicate(x)].push(x);
  }
  return result;
}

export type Action = () => void;

export const ArrayUtil = {
  range(from: number, to: number) {
    const result: number[] = [];
    for (let i = from; i <= to; i++) {
      result.push(i);
    }
    return result;
  },
};
