import "server-only";
import * as ed from "@noble/ed25519";
import type { ClaimPayload } from "../api/types";

// Mirrors src/crypto/ed25519.ts's signPayload() exactly: plain
// JSON.stringify over insertion order, not sorted keys. The caller must
// build `payload` with the same key order src/verifier/verifier.ts uses to
// reconstruct payloadToVerify -- id, subjectId, isOver18, expiresAt, nonce
// -- or the signature will not verify.
export async function signClaimPayload(
  payload: ClaimPayload,
  privateKey: Uint8Array
): Promise<string> {
  const messageBytes = Buffer.from(JSON.stringify(payload));
  const signatureBytes = await ed.signAsync(messageBytes, privateKey);
  return Buffer.from(signatureBytes).toString("hex");
}
