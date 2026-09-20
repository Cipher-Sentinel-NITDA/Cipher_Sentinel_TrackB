import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type VerdictStatus = "verified" | "rejected";

interface VerdictBannerProps {
  status: VerdictStatus;
  title: string;
  subtitle?: string;
}

const statusStyles: Record<VerdictStatus, { ring: string; badge: string; icon: string }> = {
  verified: {
    ring: "ring-verified/40",
    badge: "bg-verified/15 text-verified",
    icon: "✓",
  },
  rejected: {
    ring: "ring-rejected/40",
    badge: "bg-rejected/15 text-rejected",
    icon: "✕",
  },
};

// `key={status}` forces a fresh DOM node on every status change, so the
// .verdict-banner class's @starting-style transition re-triggers each
// time -- verified, then tampered-rejected, then replay-rejected all get
// their own distinct entrance, not one animation that only plays once.
export function VerdictBanner({ status, title, subtitle }: VerdictBannerProps) {
  const styles = statusStyles[status];

  return (
    <Card
      key={status}
      className={cn(
        "verdict-banner w-full max-w-md items-center gap-3 px-8 py-10 text-center ring-2",
        styles.ring
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center self-center rounded-full text-xl",
          styles.badge
        )}
        aria-hidden
      >
        {styles.icon}
      </span>
      <p className="text-xl font-semibold text-foreground">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </Card>
  );
}
