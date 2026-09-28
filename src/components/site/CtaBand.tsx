import { LinkButton } from "./Button";

export default function CtaBand({
  kicker,
  heading,
  cta,
  href,
}: {
  kicker: string;
  heading: string;
  cta: string;
  href: string;
}) {
  return (
    <section className="relative overflow-hidden py-20 px-6 flex flex-col items-center gap-5 text-center">
      <div className="photo-plate absolute inset-x-0 bottom-0 h-40" aria-hidden="true" />
      <p className="label text-paper/55 relative">{kicker}</p>
      <h2 className="relative text-[clamp(34px,6vw,56px)] tracking-tight">{heading}</h2>
      <LinkButton href={href} className="relative mt-1.5">
        {cta}
      </LinkButton>
    </section>
  );
}
