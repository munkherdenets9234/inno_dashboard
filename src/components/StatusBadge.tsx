const NEEDS_ATTENTION = new Set(["new"]);
const IN_PROGRESS = new Set(["contacted", "quoted"]);
const DONE = new Set(["closed"]);

export default function StatusBadge({ status }: { status: string }) {
  const tone = NEEDS_ATTENTION.has(status)
    ? "text-accent"
    : IN_PROGRESS.has(status)
      ? "text-paper"
      : DONE.has(status)
        ? "text-paper/35"
        : "text-paper/55";

  return <span className={`label ${tone}`}>{status}</span>;
}
