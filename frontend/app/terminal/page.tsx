export default function TerminalPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-blue">
        Merchant Terminal
      </p>
      <h1 className="text-2xl font-semibold text-primary">
        Verification flow lands in PR4
      </h1>
      <p className="max-w-sm text-sm text-muted">
        This route is scaffolded — the nonce request, QR handoff, and
        verified/rejected states are built out in a later PR.
      </p>
    </main>
  );
}
