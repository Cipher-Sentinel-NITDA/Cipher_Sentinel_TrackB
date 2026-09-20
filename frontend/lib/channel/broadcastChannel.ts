import type { ChannelMessage, SessionChannel } from "./types";

// Single, fixed channel name: this is a one-pair, two-tab demo (terminal +
// citizen), so verificationId on each message is used for correlation
// rather than as the channel name itself.
export const DEMO_CHANNEL_NAME = "sentinel-demo-channel";

export class BroadcastSessionChannel implements SessionChannel {
  private readonly channel: BroadcastChannel;

  constructor(name: string = DEMO_CHANNEL_NAME) {
    this.channel = new BroadcastChannel(name);
  }

  send(message: ChannelMessage): void {
    this.channel.postMessage(message);
  }

  subscribe(handler: (message: ChannelMessage) => void): () => void {
    const listener = (event: MessageEvent<ChannelMessage>) => handler(event.data);
    this.channel.addEventListener("message", listener);
    return () => this.channel.removeEventListener("message", listener);
  }

  close(): void {
    this.channel.close();
  }
}
