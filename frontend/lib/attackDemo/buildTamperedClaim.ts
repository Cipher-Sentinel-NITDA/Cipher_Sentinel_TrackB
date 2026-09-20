import type { Claim } from "@/lib/api/types";

// Alters subjectId (not isOver18) so the claim still passes the earlier
// isOver18/expiry/nonce checks in src/verifier/verifier.ts and genuinely
// fails at signature verification, rather than being rejected earlier for
// an unrelated reason -- mirrors the "Tampered Payload" test in
// src/index.ts. The signature is deliberately left unchanged: it was
// computed over the original subjectId + nonce, so once either differs,
// verifySignature() reconstructs a payload the signature no longer
// matches. `freshNonce` must be a newly-requested nonce, not the
// original's -- reusing the original (already-consumed) nonce here would
// fail on the nonce check instead, undermining the "signature invalid"
// narrative (see terminalStateMachine.ts's ADVANCE_TO_TAMPERED handling).
export function buildTamperedClaim(original: Claim, freshNonce: string): Claim {
  return {
    ...original,
    subjectId: `${original.subjectId}-TAMPERED`,
    nonce: freshNonce,
  };
}
