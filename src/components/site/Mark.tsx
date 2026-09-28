export default function Mark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      data-mark
      aria-hidden="true"
    >
      <rect x="1" y="1" width="22" height="22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 16 L16 1" stroke="var(--color-accent)" strokeWidth="1.5" />
    </svg>
  );
}
