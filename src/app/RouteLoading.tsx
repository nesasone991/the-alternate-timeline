export function RouteLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="container-page py-24 text-center">
      <p className="inscription text-sm text-parchment-muted">{label}…</p>
    </div>
  );
}
