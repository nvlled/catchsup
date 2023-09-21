export type Vector = { x: number; y: number };

export const Vector = {
  equals(v: Vector, w: Vector) {
    return (v.x | 0) === (w.x | 0) && (v.y | 0) === (w.y | 0);
  },

  length(v: Vector) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  distance(v: Vector, w: Vector) {
    const u = Vector.sub(v, w);
    return Vector.length(u);
  },

  normalize(v: Vector) {
    const len = Vector.length(v);
    v = { ...v };
    v.x /= len;
    v.y /= len;
    return v;
  },

  add(v: Vector, w: Vector) {
    v = { ...v };
    v.x += w.x;
    v.y += w.y;
    return v;
  },

  sub(v: Vector, w: Vector) {
    v = { ...v };
    v.x -= w.x;
    v.y -= w.y;
    return v;
  },

  scale(v: Vector, n: number) {
    v = { ...v };
    v.x *= n;
    v.y *= n;
    return v;
  },

  direction(to: Vector, from: Vector) {
    const v = Vector.sub(to, from);
    return Vector.normalize(v);
  },
};
