import type { SessionChannel } from "./types";
import { BroadcastSessionChannel } from "./broadcastChannel";

// The one place that decides which transport backs the terminal <-> citizen
// handshake. Swapping in a real WebSocket signaling server later (see the
// unused `ws` backend dependency) means changing only this function --
// callers everywhere else depend on the SessionChannel interface, not on
// BroadcastChannel directly.
export function createChannel(): SessionChannel {
  return new BroadcastSessionChannel();
}
