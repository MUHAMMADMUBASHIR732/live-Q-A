"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { getVoterToken } from "@/lib/voter";

const POLL_MS = 3500;

function reducer(state, action) {
  switch (action.type) {
    case "reset":
      return action.questions;
    case "add": {
      const exists = state.some((q) => q.id === action.question.id);
      return exists
        ? state.map((q) => (q.id === action.question.id ? action.question : q))
        : [action.question, ...state];
    }
    case "patch": {
      const { patch } = action;
      if (!state.some((q) => q.id === patch.id)) return state;
      // A hidden question disappears from the board.
      if (patch.status === "hidden") return state.filter((q) => q.id !== patch.id);
      return state.map((q) => (q.id === patch.id ? { ...q, ...patch } : q));
    }
    default:
      return state;
  }
}

// Everything a live screen needs, in one place.
// Pass `code` (audience) or `sessionId` (presenter). Live updates use Pusher when it is
// configured. Otherwise it checks the server every few seconds, one request per check.
export function useRoom({ sessionId = null, code = null, withReplies = false }) {
  const [session, setSession] = useState(null);
  const [questions, dispatch] = useReducer(reducer, []);
  const [replies, setReplies] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | missing
  const idRef = useRef(sessionId);
  const lastSync = useRef(0);

  const sync = useCallback(async () => {
    lastSync.current = Date.now();
    const body = idRef.current ? { sessionId: idRef.current } : { code };
    if (withReplies) body.voterToken = getVoterToken();
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (res.status === 404) {
        setStatus("missing");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      idRef.current = data.session.id;
      setSession(data.session);
      dispatch({ type: "reset", questions: data.questions });
      if (withReplies) setReplies(data.replies || []);
      setStatus("ready");
    } catch {
      // Offline: the next check will catch up.
    }
  }, [code, withReplies]);

  // First load, and again whenever the tab comes back into view (phones sleep).
  useEffect(() => {
    sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sync]);

  const liveId = sessionId || session?.id;

  useEffect(() => {
    if (!liveId) return;
    const pusher = getPusherClient();

    // No Pusher keys: check every few seconds, with a little jitter so phones do not all ask at once.
    if (!pusher) {
      let timer;
      const schedule = () => {
        timer = setTimeout(() => {
          if (document.visibilityState === "visible") sync();
          schedule();
        }, POLL_MS + Math.random() * 800);
      };
      schedule();
      return () => clearTimeout(timer);
    }

    const channelName = `session-${liveId}`;
    const channel = pusher.subscribe(channelName);
    channel.bind("question:new", (question) => dispatch({ type: "add", question }));
    channel.bind("question:patch", (patch) => dispatch({ type: "patch", patch }));
    channel.bind("session:status", (data) =>
      setSession((s) => (s ? { ...s, status: data.status } : s))
    );
    // Fires on connect and on every reconnect, so missed events are repaired.
    channel.bind("pusher:subscription_succeeded", () => {
      if (Date.now() - lastSync.current > 1500) sync();
    });

    let replyName = null;
    let replyChannel = null;
    if (withReplies) {
      replyName = `reply-${getVoterToken()}`;
      replyChannel = pusher.subscribe(replyName);
      replyChannel.bind("reply:new", sync);
    }

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      if (replyChannel) {
        replyChannel.unbind_all();
        pusher.unsubscribe(replyName);
      }
    };
  }, [liveId, sync, withReplies]);

  // Stable functions, so components can safely list them as effect dependencies.
  const add = useCallback((question) => dispatch({ type: "add", question }), []);
  const patch = useCallback((p) => dispatch({ type: "patch", patch: p }), []);
  const setSessionStatus = useCallback(
    (s) => setSession((prev) => (prev ? { ...prev, status: s } : prev)),
    []
  );
  // Show a title and code immediately while the first load finishes.
  const seed = useCallback((s) => setSession((prev) => prev || s), []);

  return {
    session,
    questions,
    replies,
    status,
    closed: session?.status === "closed",
    add,
    patch,
    setSessionStatus,
    seed,
    refresh: sync,
  };
}
