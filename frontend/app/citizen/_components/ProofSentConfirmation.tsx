import { VerdictBanner } from "@/components/VerdictBanner";
import type { Claim } from "@/lib/api/types";

export function ProofSentConfirmation({ claim }: { claim: Claim }) {
  return (
    <VerdictBanner
      status="verified"
      title="Proof sent to terminal"
      subtitle={`Claim ${claim.id} -- only "Over 18: Yes" was disclosed.`}
    />
  );
}
