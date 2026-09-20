export default function CitizenPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-blue">
        Citizen App
      </p>
      <h1 className="text-2xl font-semibold text-primary">
        Disclosure approval lands in PR3
      </h1>
      <p className="max-w-sm text-sm text-muted">
        This route is scaffolded — the incoming-request listener and
        selective-disclosure approval card are built out in a later PR.
      </p>
    </main>
  );
}
