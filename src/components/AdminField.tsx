// Thin wrapper matching the input/textarea styling used across Inno Nomads'
// admin tools, so every form shares one look.
export const fieldInputClass =
  "w-full h-10 bg-transparent border border-paper/20 px-3 text-sm focus:border-accent outline-none";
export const fieldTextareaClass =
  "w-full bg-transparent border border-paper/20 px-3 py-2 text-sm focus:border-accent outline-none resize-y";

export default function AdminField({
  label,
  htmlFor,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-field-group className={`flex flex-col gap-1.5 ${className}`}>
      <label className="label text-paper/70" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="label text-accent">{error}</span>
      ) : hint ? (
        <span className="label text-paper/35">{hint}</span>
      ) : null}
    </div>
  );
}
