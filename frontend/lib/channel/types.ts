// Local-simulation transport for the merchant terminal <-> citizen app
// handshake. Backed by BroadcastChannel today (see broadcastChannel.ts);
// createChannel() is the one swap point for a real WebSocket transport
// later -- callers only ever depend on this interface.

export type ChannelMessageType = "REQUEST" | "PROOF" | "RESET";

export interface ChannelMessage<TPayload = unknown> {
  type: ChannelMessageType;
  verificationId: string;
  payload: TPayload;
  timestamp: number;
}

export interface SessionChannel {
  send(message: ChannelMessage): void;
  /** Returns an unsubscribe function. */
  subscribe(handler: (message: ChannelMessage) => void): () => void;
  close(): void;
}
