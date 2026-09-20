interface ClaimDisclosureRowProps {
  label: string;
  value?: string;
  visibility: "shown" | "hidden";
}

export function ClaimDisclosureRow({ label, value, visibility }: ClaimDisclosureRowProps) {
  const isShown = visibility === "shown";
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`font-mono text-sm ${isShown ? "text-verified" : "text-muted-foreground/60"}`}
      >
        {isShown ? value : "•••• hidden"}
      </span>
    </div>
  );
}
