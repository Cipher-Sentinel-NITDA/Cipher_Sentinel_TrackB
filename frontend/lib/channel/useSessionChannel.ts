"use client";

import { useEffect, useRef } from "react";
import { createChannel } from "./createChannel";
import type { ChannelMessage, SessionChannel } from "./types";

// Owns the channel's lifecycle (create on mount, close on unmount) and
// keeps `onMessage` current via a ref so the subscription is only set up
// once, without going stale when the caller's handler closure changes
// across renders (e.g. a state-machine reducer capturing current state).
export function useSessionChannel(onMessage: (message: ChannelMessage) => void) {
  const channelRef = useRef<SessionChannel | null>(null);
  const handlerRef = useRef(onMessage);

  // Keep the ref current without mutating it during render (refs must
  // only be read/written in effects or event handlers).
  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    const channel = createChannel();
    channelRef.current = channel;
    const unsubscribe = channel.subscribe((message) => handlerRef.current(message));

    return () => {
      unsubscribe();
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const send = (message: ChannelMessage) => channelRef.current?.send(message);

  return { send };
}
