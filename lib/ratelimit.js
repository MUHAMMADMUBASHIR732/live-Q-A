import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// Uses Upstash Redis when configured, otherwise a simple in-memory window.
// The in-memory version is per server instance, which is fine for local use and small events.
function makeLimiter(prefix, max, windowSeconds) {
  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      prefix: `rl:${prefix}`,
    });
    return {
      async limit(key) {
        try {
          return await limiter.limit(key);
        } catch (error) {
          console.error("Rate limiter unavailable, allowing request:", error);
          return { success: true };
        }
      },
    };
  }

  const store = (globalThis.__rateStore ??= new Map());
  return {
    async limit(key) {
      const now = Date.now();
      const id = `${prefix}:${key}`;
      const recent = (store.get(id) || []).filter((t) => now - t < windowSeconds * 1000);
      if (store.size > 5000) store.clear();
      if (recent.length >= max) {
        store.set(id, recent);
        return { success: false };
      }
      recent.push(now);
      store.set(id, recent);
      return { success: true };
    },
  };
}

// One person: 3 questions per minute.
export const questionLimiter = makeLimiter("question", 3, 60);
// One person: 40 votes per minute.
export const voteLimiter = makeLimiter("vote", 40, 60);
// A whole venue behind one IP: generous, only stops floods.
export const ipLimiter = makeLimiter("ip", 300, 60);
// Presenter summaries: one per 30 seconds per session.
export const summaryLimiter = makeLimiter("summary", 1, 30);

export function getIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}
