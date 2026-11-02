let cache: { value: boolean; at: number } | null = null;

export const authState = {
  get(maxAgeMs = 60_000): boolean | null {
    if (!cache) return null;
    return Date.now() - cache.at < maxAgeMs ? cache.value : null;
  },
  set(value: boolean) {
    cache = { value, at: Date.now() };
  },
  reset() {
    cache = null;
  },
};
