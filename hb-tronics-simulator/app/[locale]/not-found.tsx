import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-shell-bg text-shell-text">
      <div className="t-title text-shell-textHi">404</div>
      <p className="t-body text-shell-dim">This screen does not exist in the simulator.</p>
      <Link href="/en/hub" className="rounded bg-brand px-4 py-2 t-cta text-brand-on">
        Return to hub
      </Link>
    </div>
  );
}
