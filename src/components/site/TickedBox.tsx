export default function TickedBox({
  accent,
  className,
  children,
  ...rest
}: {
  accent?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`ticked ${accent ? "ticked-accent" : ""} ${className ?? ""}`} {...rest}>
      <span className="tick-tl" aria-hidden="true" />
      <span className="tick-tr" aria-hidden="true" />
      {children}
    </div>
  );
}
