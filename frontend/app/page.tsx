import Link from "next/link";

const routes = [
  {
    href: "/terminal",
    label: "Merchant Terminal",
    description: "Request a verification, watch it resolve live.",
  },
  {
    href: "/citizen",
    label: "Citizen App",
    description: "Review an incoming request, approve only what's asked.",
  },
] as const;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Fact Proofing Without Records
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Sentinel Verification
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Prove a fact, not a file. Pick a screen to open.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="group flex flex-col gap-2 rounded-xl border border-elevated bg-surface p-6 transition-[transform,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-accent-blue active:scale-[0.98]"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-accent-text">
              {route.href}
            </span>
            <span className="text-lg font-semibold text-foreground">
              {route.label}
            </span>
            <span className="text-sm text-muted-foreground">{route.description}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
