"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";

const POLL_MS = 3000;

function reducer(state, action) {
  switch (action.type) {
    case "reset":
      return action.questions;
    case "upsert": {
      const rest = state.filter((q) => q.id !== action.question.id);
      // Hidden questions disappear from the list.
      return action.question.status === "hidden" ? rest : [action.question, ...rest];
    }
    default:
      return state;
  }
}

// Keeps the question list live. Uses Pusher when configured, otherwise polls every 3 seconds.
export function useLiveQuestions(sessionId, initialQuestions, initialClosed = false) {
  const [questions, dispatch] = useReducer(reducer, initialQuestions);
  const [closed, setClosed] = useState(initialClosed);

  const upsert = useCallback((question) => dispatch({ type: "upsert", question }), []);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const res = await fetch(`/api/questions?sessionId=${sessionId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        dispatch({ type: "reset", questions: data.questions });
        setClosed(data.status === "closed");
      } catch {
        // Offline: the next sync will repair the list.
      }
    }

    // Phones sleep and lose connections, so re-sync whenever the tab becomes visible.
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    const pusher = getPusherClient();

    // No Pusher keys: poll instead.
    if (!pusher) {
      sync();
      const timer = setInterval(sync, POLL_MS);
      return () => {
        cancelled = true;
        clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }

    const channelName = `session-${sessionId}`;
    const channel = pusher.subscribe(channelName);

    const onChange = (question) => dispatch({ type: "upsert", question });
    channel.bind("question:new", onChange);
    channel.bind("question:updated", onChange);
    channel.bind("session:status", (data) => setClosed(data.status === "closed"));

    // Fires on connect and on every reconnect, so missed events are repaired.
    channel.bind("pusher:subscription_succeeded", sync);

    return () => {
      cancelled = true;
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sessionId]);

  return { questions, closed, setClosed, upsert };
}
