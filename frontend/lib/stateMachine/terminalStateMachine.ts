import type { Claim } from "@/lib/api/types";

export interface TerminalRequest {
  verificationId: string;
  nonce: string;
  issuedAt: number;
}

export type AttackStep = "attack-tampered" | "attack-replay";
export type VerifyStep = "primary" | AttackStep;

// The full flow: idle -> requesting-nonce -> awaiting-proof -> verifying
// (primary) -> verified -> [auto-advance] -> verifying (attack-tampered)
// -> rejected -> [auto-advance] -> verifying (attack-replay) -> rejected.
// `originalClaim` is the citizen's one genuinely valid signed claim,
// carried forward through the whole sequence -- the tampered step mutates
// a copy of it, the replay step resubmits it completely unchanged.
export type TerminalState =
  | { status: "idle" }
  | { status: "requesting-nonce" }
  | { status: "awaiting-proof"; request: TerminalRequest }
  | { status: "verifying"; step: VerifyStep; claim: Claim; originalClaim: Claim }
  | { status: "verified"; claim: Claim; originalClaim: Claim; message: string }
  | {
      status: "rejected";
      step: AttackStep;
      label: string;
      message: string;
      claim: Claim;
      originalClaim: Claim;
    }
  | { status: "error"; message: string };

export type TerminalAction =
  | { type: "START" }
  | { type: "NONCE_READY"; request: TerminalRequest }
  | { type: "PROOF_RECEIVED"; claim: Claim }
  | { type: "VERIFIED"; message: string }
  | { type: "ADVANCE_TO_TAMPERED"; claim: Claim }
  | { type: "ADVANCE_TO_REPLAY" }
  | { type: "REJECTED"; label: string; message: string }
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
      // Ignore a stray PROOF outside the awaiting-proof window (e.g. a
      // late message after a reset).
      if (state.status !== "awaiting-proof") return state;
      return { status: "verifying", step: "primary", claim: action.claim, originalClaim: action.claim };

    case "VERIFIED":
      if (state.status !== "verifying" || state.step !== "primary") return state;
      return { status: "verified", claim: state.claim, originalClaim: state.originalClaim, message: action.message };

    case "ADVANCE_TO_TAMPERED":
      if (state.status !== "verified") return state;
      return {
        status: "verifying",
        step: "attack-tampered",
        claim: action.claim,
        originalClaim: state.originalClaim,
      };

    case "ADVANCE_TO_REPLAY":
      if (state.status !== "rejected" || state.step !== "attack-tampered") return state;
      // Resubmits the original claim completely unchanged -- same
      // already-consumed nonce, same signature.
      return {
        status: "verifying",
        step: "attack-replay",
        claim: state.originalClaim,
        originalClaim: state.originalClaim,
      };

    case "REJECTED":
      if (state.status !== "verifying" || state.step === "primary") return state;
      return {
        status: "rejected",
        step: state.step,
        label: action.label,
        message: action.message,
        claim: state.claim,
        originalClaim: state.originalClaim,
      };

    case "FAILED":
      return { status: "error", message: action.message };

    case "RESET":
      return { status: "idle" };

    default:
      return state;
  }
}
