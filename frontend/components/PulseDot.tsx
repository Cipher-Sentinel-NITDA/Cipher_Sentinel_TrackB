export function PulseDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-2.5 w-2.5 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pending opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pending" />
    </span>
  );
}
