export default function GhostText({ children }: { children: React.ReactNode }) {
  return (
    <div className="ghost-text" data-ghost aria-hidden="true">
      {children}
    </div>
  );
}
