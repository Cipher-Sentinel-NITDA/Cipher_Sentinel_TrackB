import type { Claim } from "@/lib/api/types";

export interface TerminalRequest {
  verificationId: string;
  nonce: string;
  issuedAt: number;
}

// Happy-path only for now (idle -> verified/error). The Day-4 attack
// sequence (attack-tampered/attack-replay steps) extends this in a later
// PR -- kept out here rather than pre-built, since there's nothing to
// exercise it yet.
export type TerminalState =
  | { status: "idle" }
  | { status: "requesting-nonce" }
  | { status: "awaiting-proof"; request: TerminalRequest }
  | { status: "verifying"; request: TerminalRequest; claim: Claim }
  | { status: "verified"; claim: Claim; message: string }
  | { status: "error"; message: string };

export type TerminalAction =
  | { type: "START" }
  | { type: "NONCE_READY"; request: TerminalRequest }
  | { type: "PROOF_RECEIVED"; claim: Claim }
  | { type: "VERIFIED"; claim: Claim; message: string }
  | { type: "FAILED"; message: string }
  | { type: "RESET" };

export const initialTerminalState: TerminalState = { status: "idle" };

export function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case "START":
      return { status: "requesting-nonce" };
    case "NONCE_READY":
      return { status: "awaiting-proof", request: action.request };
    case "PROOF_RECEIVED":
      // Ignore a stray PROOF that arrives outside the awaiting-proof
      // window (e.g. a late message after a reset).
      if (state.status !== "awaiting-proof") return state;
      return { status: "verifying", request: state.request, claim: action.claim };
    case "VERIFIED":
      return { status: "verified", claim: action.claim, message: action.message };
    case "FAILED":
      return { status: "error", message: action.message };
    case "RESET":
      return { status: "idle" };
    default:
      return state;
  }
}
