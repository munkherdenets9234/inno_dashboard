"use client";

// A submit button for an action that is hard or impossible to undo —
// rotating a key, cancelling a subscription, revoking a service client.
//
// Generic rather than one component per action (the pattern
// DeletePackageButton/UnassignPackageButton started) because every one of
// these is the same three lines, and a confirmation prompt that is copy-pasted
// is a confirmation prompt that eventually gets pasted without its message
// being updated.
export default function ConfirmAction({
  action,
  confirm,
  label,
  className = "label text-paper/55 hover:text-accent transition-colors",
}: {
  action: () => Promise<void>;
  confirm: string;
  label: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
