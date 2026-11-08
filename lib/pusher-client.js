import PusherClient from "pusher-js";

let client;

// Returns null when Pusher is not configured, so callers can fall back to polling.
// Created lazily so it never runs during server rendering.
export function getPusherClient() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  if (!client) client = new PusherClient(key, { cluster });
  return client;
}
