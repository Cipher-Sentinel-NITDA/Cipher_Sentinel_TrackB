"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useSessionChannel } from "@/lib/channel/useSessionChannel";
import type { ChannelMessage } from "@/lib/channel/types";
import { requestNonce, verifyClaim } from "@/lib/api/client";
import type { Claim } from "@/lib/api/types";
import { buildTamperedClaim } from "@/lib/attackDemo/buildTamperedClaim";
import {
  initialTerminalState,
  terminalReducer,
  type AttackStep,
  type TerminalRequest,
  type VerifyStep,
} from "@/lib/stateMachine/terminalStateMachine";
import { QrCode } from "@/components/QrCode";
import { VerdictBanner } from "@/components/VerdictBanner";
import { PulseDot } from "@/components/PulseDot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

const REQUESTED_CLAIM = "isOver18";
const ATTACK_ADVANCE_DELAY_MS = 1800;

const VERIFYING_LABELS: Record<VerifyStep, string> = {
  primary: "Verifying proof...",
  "attack-tampered": "Verifying tampered credential...",
  "attack-replay": "Verifying replayed proof...",
};

const REJECTION_LABELS: Record<AttackStep, string> = {
  "attack-tampered": "REJECTED — signature invalid",
  "attack-replay": "REJECTED — challenge mismatch",
};

const STEP_BADGES: Record<"verified" | AttackStep, string> = {
  verified: "Step 1 — Live verification",
  "attack-tampered": "Step 2 — Tampered credential",
  "attack-replay": "Step 3 — Replayed proof",
};

// Fires `onAdvance` once, `delayMs` after `active` becomes true --
// interruptible by calling `onAdvance` directly from a manual "Next"
// button. `onAdvance` is read via a ref so it can be a fresh closure each
// render without resetting the timer.
function useAutoAdvance(active: boolean, delayMs: number, onAdvance: () => void) {
  const advanceRef = useRef(onAdvance);
  useEffect(() => {
    advanceRef.current = onAdvance;
  });

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => advanceRef.current(), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
}

export default function TerminalPage() {
  const [state, dispatch] = useReducer(terminalReducer, initialTerminalState);

  // The channel message handler is set up once (see useSessionChannel) and
  // must read the *current* verificationId without going stale -- a ref
  // is simpler here than mirroring the whole reducer state into the
  // handler's closure.
  const verificationIdRef = useRef<string | null>(null);

  const handleMessage = useCallback((message: ChannelMessage) => {
    if (message.type !== "PROOF") return;
    if (message.verificationId !== verificationIdRef.current) return;
    dispatch({ type: "PROOF_RECEIVED", claim: message.payload as Claim });
  }, []);

  const { send } = useSessionChannel(handleMessage);

  useEffect(() => {
    verificationIdRef.current = state.status === "awaiting-proof" ? state.request.verificationId : null;
  }, [state]);

  // Runs the real /api/v1/verify call the moment we enter "verifying",
  // for every step (primary and both attack steps) -- identical code
  // path, nothing special-cased.
  useEffect(() => {
    if (state.status !== "verifying") return;
    let cancelled = false;
    const { step, claim } = state;

    verifyClaim(claim)
      .then((res) => {
        if (cancelled) return;

        if (step === "primary") {
          if (res.verified) {
            dispatch({ type: "VERIFIED", message: res.message });
          } else {
            dispatch({ type: "FAILED", message: res.message });
          }
          return;
        }

        // Attack steps are *expected* to fail. If one unexpectedly
        // verifies, that's a real anomaly, not a demo outcome -- surface
        // it as a hard error rather than mislabeling it a rejection.
        if (res.verified) {
          dispatch({ type: "FAILED", message: `Attack step unexpectedly succeeded (${step}).` });
        } else {
          dispatch({ type: "REJECTED", label: REJECTION_LABELS[step], message: res.message });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        dispatch({
          type: "FAILED",
          message: err instanceof Error ? err.message : "Verification request failed.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const advanceToTampered = useCallback(async () => {
    if (state.status !== "verified") return;
    try {
      const { nonce: freshNonce } = await requestNonce();
      const tamperedClaim = buildTamperedClaim(state.originalClaim, freshNonce);
      dispatch({ type: "ADVANCE_TO_TAMPERED", claim: tamperedClaim });
    } catch (err) {
      dispatch({
        type: "FAILED",
        message: err instanceof Error ? err.message : "Failed to stage the tampered-credential attack.",
      });
    }
  }, [state]);

  const advanceToReplay = useCallback(() => {
    dispatch({ type: "ADVANCE_TO_REPLAY" });
  }, []);

  useAutoAdvance(state.status === "verified", ATTACK_ADVANCE_DELAY_MS, advanceToTampered);
  useAutoAdvance(
    state.status === "rejected" && state.step === "attack-tampered",
    ATTACK_ADVANCE_DELAY_MS,
    advanceToReplay
  );

  const handleStart = async () => {
    dispatch({ type: "START" });
    try {
      const { nonce } = await requestNonce();
      const request: TerminalRequest = {
        verificationId: crypto.randomUUID(),
        nonce,
        issuedAt: Date.now(),
      };
      dispatch({ type: "NONCE_READY", request });
      send({
        type: "REQUEST",
        verificationId: request.verificationId,
        payload: { nonce: request.nonce, requestedClaim: REQUESTED_CLAIM },
        timestamp: request.issuedAt,
      });
    } catch (err) {
      dispatch({
        type: "FAILED",
        message: err instanceof Error ? err.message : "Failed to start verification.",
      });
    }
  };

  const handleReset = () => {
    dispatch({ type: "RESET" });
    send({ type: "RESET", verificationId: "", payload: null, timestamp: Date.now() });
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      {state.status === "idle" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
            Merchant Terminal
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Ready to verify</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Requests a nonce, renders a QR for the citizen app, and verifies the
            returned proof against the live backend.
          </p>
          <Button onClick={handleStart}>Start Verification</Button>
        </div>
      )}

      {state.status === "requesting-nonce" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner />
          <span className="text-sm">Requesting a challenge...</span>
        </div>
      )}

      {state.status === "awaiting-proof" && (
        <div className="flex flex-col items-center gap-4">
          <QrCode
            value={JSON.stringify({
              v: 1,
              verificationId: state.request.verificationId,
              nonce: state.request.nonce,
              requestedClaim: REQUESTED_CLAIM,
              issuedAt: state.request.issuedAt,
            })}
          />
          <div className="flex items-center gap-2">
            <PulseDot />
            <span className="font-mono text-xs uppercase tracking-widest text-pending">
              Waiting for the citizen app
            </span>
          </div>
        </div>
      )}

      {state.status === "verifying" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner />
          <span className="text-sm">{VERIFYING_LABELS[state.step]}</span>
        </div>
      )}

      {state.status === "verified" && (
        <div className="flex flex-col items-center gap-6">
          <Badge variant="outline">{STEP_BADGES.verified}</Badge>
          <VerdictBanner status="verified" title="VERIFIED — Over 18" subtitle={state.message} />
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={advanceToTampered}>Run attack demo →</Button>
          </div>
        </div>
      )}

      {state.status === "rejected" && (
        <div className="flex flex-col items-center gap-6">
          <Badge variant="outline">{STEP_BADGES[state.step]}</Badge>
          <VerdictBanner status="rejected" title={state.label} subtitle={state.message} />
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleReset}>
              {state.step === "attack-tampered" ? "Reset" : "Run again"}
            </Button>
            {state.step === "attack-tampered" && (
              <Button onClick={advanceToReplay}>Replay captured proof →</Button>
            )}
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-6">
          <VerdictBanner status="rejected" title="Something went wrong" subtitle={state.message} />
          <Button variant="outline" onClick={handleReset}>
            Try again
          </Button>
        </div>
      )}
    </main>
  );
}
