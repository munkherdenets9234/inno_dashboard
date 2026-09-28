import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-1.5 label px-4.5 py-3 transition-colors";

const variants = {
  primary: "bg-accent text-on-accent hover:bg-accent-dark",
  outline: "border border-paper/30 text-paper hover:border-paper",
  inverse: "bg-paper text-ink hover:bg-paper/85",
};

type Variant = keyof typeof variants;

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function ActionButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
