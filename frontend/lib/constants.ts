// Local-only, never transmitted anywhere. The real Claim/ClaimPayload
// schema (lib/api/types.ts) has no name/DOB/address fields at all -- it's
// minimal by construction. This object exists purely so the citizen
// approval screen can show which fields are "shown" vs "hidden", making
// selective disclosure visible on screen. It must never be sent to the
// demo-issuer route or appear in a ClaimPayload.
export const DEMO_CITIZEN_PROFILE = {
  name: "Ada Obi",
  dateOfBirth: "1998-04-12",
  address: "14 Marina Road, Lagos",
  isOver18: true,
} as const;
