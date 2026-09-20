"use client";

import { useCallback, useEffect, useState } from "react";
import { useSessionChannel } from "@/lib/channel/useSessionChannel";
import type { ChannelMessage } from "@/lib/channel/types";
import type { Claim } from "@/lib/api/types";
import { DEMO_CITIZEN_PROFILE } from "@/lib/constants";
import { IncomingRequestListener } from "./_components/IncomingRequestListener";
import { DisclosureApprovalCard } from "./_components/DisclosureApprovalCard";
import { ProofSentConfirmation } from "./_components/ProofSentConfirmation";

interface IncomingRequest {
  verificationId: string;
  nonce: string;
  requestedClaim: string;
}

interface RequestPayload {
  nonce: string;
  requestedClaim: string;
}

type CitizenState =
  | { status: "waiting" }
  // Brief pending-amber beat before the approval card appears -- this *is*
  // the simulated "scan" (see IncomingRequestListener).
  | { status: "request-received"; request: IncomingRequest }
  | { status: "reviewing"; request: IncomingRequest }
  | { status: "issuing"; request: IncomingRequest }
  | { status: "sent"; request: IncomingRequest; claim: Claim }
  | { status: "error"; request: IncomingRequest; message: string };

const REQUEST_RECEIVED_BEAT_MS = 700;

export default function CitizenPage() {
  const [state, setState] = useState<CitizenState>({ status: "waiting" });

  const handleMessage = useCallback((message: ChannelMessage) => {
    if (message.type === "REQUEST") {
      const payload = message.payload as RequestPayload;
      setState({
        status: "request-received",
        request: {
          verificationId: message.verificationId,
          nonce: payload.nonce,
          requestedClaim: payload.requestedClaim,
        },
      });
    }
    if (message.type === "RESET") {
      setState({ status: "waiting" });
    }
  }, []);

  const { send } = useSessionChannel(handleMessage);

  // Auto-advance out of the brief "Request received" beat into the
  // approval card.
  useEffect(() => {
    if (state.status !== "request-received") return;
    const request = state.request;
    const timer = setTimeout(() => {
      setState({ status: "reviewing", request });
    }, REQUEST_RECEIVED_BEAT_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const handleApprove = async () => {
    if (state.status !== "reviewing") return;
    const { request } = state;
    setState({ status: "issuing", request });

    try {
      const res = await fetch("/api/demo/issue-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: request.nonce }),
      });
      if (!res.ok) throw new Error("Failed to issue demo credential.");
      const claim = (await res.json()) as Claim;

      send({
        type: "PROOF",
        verificationId: request.verificationId,
        payload: claim,
        timestamp: Date.now(),
      });

      setState({ status: "sent", request, claim });
    } catch (err) {
      setState({
        status: "error",
        request,
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  };

  const handleDecline = () => setState({ status: "waiting" });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      {(state.status === "waiting" || state.status === "request-received") && (
        <IncomingRequestListener hasIncomingRequest={state.status === "request-received"} />
      )}

      {(state.status === "reviewing" || state.status === "issuing") && (
        <DisclosureApprovalCard
          profile={DEMO_CITIZEN_PROFILE}
          requestedClaim={state.request.requestedClaim}
          busy={state.status === "issuing"}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />
      )}

      {state.status === "sent" && <ProofSentConfirmation claim={state.claim} />}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-rejected">{state.message}</p>
          <button
            type="button"
            className="text-sm text-accent-blue underline"
            onClick={handleDecline}
          >
            Back
          </button>
        </div>
      )}
    </main>
  );
}
