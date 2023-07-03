export function call<T>(fn: () => T) {
  return fn();
}
export function callWith<A, B>(x: A, fn: (x: A) => B) {
  return fn(x);
}

export function padZero(n: number | string, digits = 2) {
  n = typeof n === "number" ? n.toString() : n;
  return n.padStart(digits, "0");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
export type Awaitable = () => Promise<void>;

export const ArrayUtil = {
  randomSelect<T>(xs: T[]) {
    const i = (Math.random() * xs.length) | 0;
    return xs[i];
  },
  range(from: number, to: number) {
    const result: number[] = [];
    for (let i = from; i <= to; i++) {
      result.push(i);
    }
    return result;
  },
};

export const DateUtil = {
  toStringISO8601(date: Date) {
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(
      date.getDate()
    )}`;
  },
};

export function createPairSSet<A, B>(data?: [A, B][]) {
  const pairSet = new Map<A, Set<B>>();

  if (data) {
    for (const [x, y] of data) add([x, y]);
  }

  return { add, has };

  function add([x, y]: [x: A, y: B]) {
    if (!pairSet.has(x)) pairSet.set(x, new Set<B>());
    pairSet.get(x)?.add(y);
  }

  function has([x, y]: [x: A, y: B]): boolean {
    return !!pairSet.get(x)?.has(y);
  }
}

export function sum(nums: number[]) {
  let sum = 0;
  for (const n of nums) sum += n;
  return sum;
}
