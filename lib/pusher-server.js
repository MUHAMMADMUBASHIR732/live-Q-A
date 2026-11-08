import Pusher from "pusher";

const configured = Boolean(
  process.env.PUSHER_APP_ID &&
    process.env.PUSHER_SECRET &&
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER
);

const globalForPusher = globalThis;

// null when Pusher is not configured. The app then falls back to polling.
const pusherServer = configured
  ? (globalForPusher.__pusherServer ??= new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    }))
  : null;

// Best effort: a failed broadcast never fails the request. The next re-sync repairs it.
export async function broadcast(sessionId, event, payload) {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(`session-${sessionId}`, event, payload);
  } catch (error) {
    console.error("Broadcast failed:", error);
  }
}

// Pings one private channel (for example, the person who just got a reply).
// Never put content in the payload: the receiver fetches it with their own secret token.
export async function notifyChannel(channel, event, payload) {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(channel, event, payload);
  } catch (error) {
    console.error("Notify failed:", error);
  }
}
