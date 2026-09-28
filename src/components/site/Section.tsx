import { forwardRef } from "react";

const Section = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function Section({ className = "", children, ...rest }, ref) {
    return (
      <section
        ref={ref}
        className={`border-b border-paper/10 px-6 py-11 md:px-11 flex flex-col gap-6 ${className}`}
        {...rest}
      >
        {children}
      </section>
    );
  }
);

export default Section;

export function SectionHeader({
  eyebrow,
  action,
}: {
  eyebrow: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="label text-paper">{eyebrow}</p>
      {action}
    </div>
  );
}
