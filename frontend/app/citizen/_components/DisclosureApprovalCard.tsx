import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ClaimDisclosureRow } from "@/components/ClaimDisclosureCard";
import type { DEMO_CITIZEN_PROFILE } from "@/lib/constants";

interface DisclosureApprovalCardProps {
  profile: typeof DEMO_CITIZEN_PROFILE;
  requestedClaim: string;
  busy: boolean;
  onApprove: () => void;
  onDecline: () => void;
}

export function DisclosureApprovalCard({
  profile,
  requestedClaim,
  busy,
  onApprove,
  onDecline,
}: DisclosureApprovalCardProps) {
  return (
    <Card className="fade-scale-in w-full max-w-md">
      <CardHeader>
        <CardTitle>Share verification proof?</CardTitle>
        <CardDescription>
          The merchant terminal is asking to verify:{" "}
          <span className="font-mono text-xs text-accent-text">{requestedClaim}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClaimDisclosureRow label="Over 18" value="Yes" visibility="shown" />
        <ClaimDisclosureRow label="Full Name" value={profile.name} visibility="hidden" />
        <ClaimDisclosureRow label="Date of Birth" value={profile.dateOfBirth} visibility="hidden" />
        <ClaimDisclosureRow label="Address" value={profile.address} visibility="hidden" />
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t-0">
        <Button variant="outline" onClick={onDecline} disabled={busy}>
          Decline
        </Button>
        <Button onClick={onApprove} disabled={busy}>
          {busy && <Spinner />}
          {busy ? "Signing..." : "Approve & Share"}
        </Button>
      </CardFooter>
    </Card>
  );
}
