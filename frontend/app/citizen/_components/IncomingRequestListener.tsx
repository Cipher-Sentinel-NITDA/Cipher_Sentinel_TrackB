import { PulseDot } from "@/components/PulseDot";

// Purely presentational -- the citizen page owns the actual channel
// subscription (via useSessionChannel) and just tells this component
// whether a request has arrived yet. This *is* the simulated "scan": no
// camera or QR-decode step, just an instant reaction to the REQUEST
// message the terminal broadcasts.
interface IncomingRequestListenerProps {
  hasIncomingRequest: boolean;
}

export function IncomingRequestListener({ hasIncomingRequest }: IncomingRequestListenerProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex items-center gap-2">
        <PulseDot />
        <span className="font-mono text-xs uppercase tracking-widest text-pending">
          {hasIncomingRequest ? "Request received" : "Waiting for a verification request"}
        </span>
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">
        {hasIncomingRequest
          ? "Reviewing the disclosure request..."
          : "Open the merchant terminal in another tab and start a verification."}
      </p>
    </div>
  );
}
