"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useSessionChannel } from "@/lib/channel/useSessionChannel";
import type { ChannelMessage } from "@/lib/channel/types";
import { requestNonce, verifyClaim } from "@/lib/api/client";
import type { Claim } from "@/lib/api/types";
import {
  initialTerminalState,
  terminalReducer,
  type TerminalRequest,
} from "@/lib/stateMachine/terminalStateMachine";
import { QrCode } from "@/components/QrCode";
import { VerdictBanner } from "@/components/VerdictBanner";
import { PulseDot } from "@/components/PulseDot";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const REQUESTED_CLAIM = "isOver18";

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

  // Runs the real /api/v1/verify call the moment we enter "verifying".
  useEffect(() => {
    if (state.status !== "verifying") return;
    let cancelled = false;

    verifyClaim(state.claim)
      .then((res) => {
        if (cancelled) return;
        if (res.verified) {
          dispatch({ type: "VERIFIED", claim: state.claim, message: res.message });
        } else {
          dispatch({ type: "FAILED", message: res.message });
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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-blue">
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
          <span className="text-sm">Verifying proof...</span>
        </div>
      )}

      {state.status === "verified" && (
        <div className="flex flex-col items-center gap-6">
          <VerdictBanner status="verified" title="VERIFIED — Over 18" subtitle={state.message} />
          <Button variant="outline" onClick={handleReset}>
            Run again
          </Button>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-6">
          <VerdictBanner status="rejected" title="REJECTED" subtitle={state.message} />
          <Button variant="outline" onClick={handleReset}>
            Try again
          </Button>
        </div>
      )}
    </main>
  );
}
