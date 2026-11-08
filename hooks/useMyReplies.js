"use client";

import { useCallback, useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { getVoterToken } from "@/lib/voter";

// The private replies sent to this browser's owner. Uses a private ping channel when Pusher
// is configured (the ping carries no content), otherwise polls every 5 seconds.
export function useMyReplies(sessionId) {
  const [replies, setReplies] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/replies/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, voterToken: getVoterToken() }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setReplies(data.replies);
    } catch {
      // Offline: the next refresh will catch up.
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    const pusher = getPusherClient();
    if (!pusher) {
      const timer = setInterval(refresh, 5000);
      return () => {
        clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }

    const channelName = `reply-${getVoterToken()}`;
    const channel = pusher.subscribe(channelName);
    channel.bind("reply:new", refresh);
    channel.bind("pusher:subscription_succeeded", refresh);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { replies, refresh };
}
