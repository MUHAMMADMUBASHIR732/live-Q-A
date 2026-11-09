// A tiny per-server cache of "which session does this join code belong to".
// People post many questions into the same session, so this removes one database
// round trip from almost every question. It expires fast, so ending a session takes effect quickly.
const TTL_MS = 5000;
const store = (globalThis.__sessionCache ??= new Map());

export function getCachedSession(code) {
  const hit = store.get(code);
  if (hit && hit.expires > Date.now()) return hit.value;
  store.delete(code);
  return null;
}

export function cacheSession(code, value) {
  if (store.size > 2000) store.clear();
  store.set(code, { value, expires: Date.now() + TTL_MS });
}
