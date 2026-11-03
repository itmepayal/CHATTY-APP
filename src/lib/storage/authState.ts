type Listener = (v: boolean | null) => void;
let value: boolean | null = null;
const listeners = new Set<Listener>();

export const authState = {
  get: () => value,
  set: (v: boolean | null) => {
    value = v;
    listeners.forEach((l) => l(v));
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
