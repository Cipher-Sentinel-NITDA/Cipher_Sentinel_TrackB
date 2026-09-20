import type { Claim } from "./types";

export interface NonceResponse {
  nonce: string;
}

export interface VerifyResponse {
  verified: boolean;
  message: string;
}

interface ErrorResponse {
  error: string;
}

// Both endpoints are called same-origin at /api/v1/* -- next.config.ts
// rewrites this to BACKEND_URL server-side, so the browser never makes a
// cross-origin request and no CORS setup is needed on the backend.

export async function requestNonce(): Promise<NonceResponse> {
  const res = await fetch("/api/v1/nonce", { method: "POST" });
  const body = await res.json();

  if (!res.ok) {
    throw new Error((body as ErrorResponse).error ?? "Failed to request a nonce.");
  }

  return body as NonceResponse;
}

export async function verifyClaim(claim: Claim): Promise<VerifyResponse> {
  const res = await fetch("/api/v1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(claim),
  });
  const body = await res.json();

  // 401 is an expected application outcome here (verified: false), not a
  // transport failure -- the backend already shapes it as VerifyResponse.
  // 400/500 bodies only carry `error`, so those genuinely throw.
  if (!res.ok && !("verified" in body)) {
    throw new Error((body as ErrorResponse).error ?? "Verification request failed.");
  }

  return body as VerifyResponse;
}
