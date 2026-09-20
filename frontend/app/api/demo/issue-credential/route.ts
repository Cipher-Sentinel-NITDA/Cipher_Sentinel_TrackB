import { NextResponse } from "next/server";
import { getDemoKeyPair } from "@/lib/demoIssuer/demoIssuerKey";
import { signClaimPayload } from "@/lib/demoIssuer/sign";
import { DEMO_CITIZEN_PROFILE } from "@/lib/constants";
import type { Claim, ClaimPayload } from "@/lib/api/types";

// Demo-only mock issuer: signs a fresh claim against a live nonce on
// behalf of the citizen app. There's no real issuer UI/flow in this MVP
// (signing is an issuer-side operation, not something an end user does),
// and a claim can't be pre-signed ahead of time since it's bound to a
// nonce that's minted per-session with a short TTL. Runs server-side only
// -- see lib/demoIssuer/demoIssuerKey.ts for why the key never ships to
// the browser.
const CLAIM_TTL_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { nonce?: unknown } | null;

  if (!body || typeof body.nonce !== "string" || body.nonce.trim() === "") {
    return NextResponse.json({ error: "Missing nonce." }, { status: 400 });
  }

  const { privateKey, publicKeyHex } = await getDemoKeyPair();

  // Key order matters here -- see lib/demoIssuer/sign.ts.
  const payload: ClaimPayload = {
    id: `CLAIM-${crypto.randomUUID()}`,
    subjectId: "DEMO-CITIZEN-001",
    isOver18: DEMO_CITIZEN_PROFILE.isOver18,
    expiresAt: Date.now() + CLAIM_TTL_MS,
    nonce: body.nonce,
  };

  const signature = await signClaimPayload(payload, privateKey);

  const claim: Claim = {
    ...payload,
    issuerPublicKey: publicKeyHex,
    signature,
  };

  return NextResponse.json(claim);
}
