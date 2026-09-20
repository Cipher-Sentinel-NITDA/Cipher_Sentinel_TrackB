// Duplicated from src/verifier/types.ts -- keep in sync. No shared package
// exists between backend and frontend yet, so this is a deliberate,
// small duplication rather than an uninvited npm-workspace restructure.

export interface Claim {
  id: string;
  subjectId: string;
  isOver18: boolean;
  issuerPublicKey: string;
  signature: string;
  expiresAt: number;
  nonce: string;
}

// The subset that gets signed/verified -- excludes issuerPublicKey/signature.
// Field order matters: src/crypto/ed25519.ts signs/verifies via plain
// JSON.stringify over insertion order, not sorted keys, so this order must
// match src/verifier/verifier.ts's payloadToVerify construction exactly.
export interface ClaimPayload {
  id: string;
  subjectId: string;
  isOver18: boolean;
  expiresAt: number;
  nonce: string;
}
