"use client";

import Link from "next/link";
import NavBar from "@/components/site/NavBar";
import SiteFooter from "@/components/site/SiteFooter";
import CtaBand from "@/components/site/CtaBand";
import GhostText from "@/components/site/GhostText";
import TickedBox from "@/components/site/TickedBox";
import Section, { SectionHeader } from "@/components/site/Section";
import Reveal from "@/components/site/Reveal";
import { LinkButton } from "@/components/site/Button";
import { playHero, playStaggerReveal } from "@/lib/motion";
import { useLang } from "@/components/site/i18n/LanguageProvider";
import { useCopy } from "@/components/site/i18n/ContentProvider";
import { price } from "@/lib/i18n/price";
import { localizePackage, formatPrice, type Package } from "@/lib/site-packages";

export default function PriceView({ packages }: { packages: Package[] }) {
  const { lang } = useLang();
  const t = useCopy(price, "price");
  const localized = packages.map((p) => localizePackage(p, lang));

  // Union of every feature string across all packages, in first-seen order —
  // the comparison table's row set, since packages carry free-text feature
  // lists rather than a fixed shared schema.
  const featureRows = Array.from(new Set(localized.flatMap((p) => p.features)));

  return (
    <>
      <NavBar />

      <main className="flex-1">
        <Reveal
          as="section"
          run={playHero}
          trigger="mount"
          className="relative overflow-hidden border-b border-paper/10 h-[440px] md:h-[520px]"
        >
          <div className="photo-plate absolute inset-0" aria-hidden="true" />
          <GhostText>{t.ghost}</GhostText>

          <div className="absolute inset-x-0 top-[26%] flex flex-col items-center gap-1.5 px-4 z-10">
            {t.hero.heading.map((line) => (
              <h1 key={line} className="reveal-mask text-center">
                <span data-reveal-line className="block text-[9vw] leading-none tracking-tight sm:text-[52px] md:text-[76px]">
                  {line}
                </span>
              </h1>
            ))}
          </div>

          <div className="hidden lg:flex flex-col gap-4 absolute left-8 top-14 w-52 text-right z-10">
            <span data-label className="label text-paper/35">
              {t.hero.labels.scopeChanges[0]}
              <br />
              {t.hero.labels.scopeChanges[1]}
            </span>
            <span data-label className="label text-paper/85">
              {t.hero.labels.everyPackage[0]}
              <br />
              {t.hero.labels.everyPackage[1]}
            </span>
          </div>
          <div className="hidden lg:flex flex-col gap-4 absolute right-8 top-16 w-56 z-10">
            <span data-label className="label text-paper/85">
              {t.hero.labels.designBuild[0]}
              <br />
              {t.hero.labels.designBuild[1]}
            </span>
            <span data-label className="label text-paper/35">
              {t.hero.labels.noHourly[0]}
              <br />
              {t.hero.labels.noHourly[1]}
            </span>
          </div>

          <TickedBox
            data-label
            className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[92%] max-w-[560px] px-6 py-5 z-10 bg-ink/40 backdrop-blur-sm"
          >
            <p className="label text-paper/70 text-center leading-loose">{t.hero.description}</p>
          </TickedBox>
        </Reveal>

        <Reveal
          as={Section}
          run={(r) => playStaggerReveal(r, "[data-pcard]", { translateY: 50, duration: 700, stagger: 90 })}
        >
          <SectionHeader eyebrow={t.packages.eyebrow} />
          {localized.length === 0 ? (
            <p className="label text-paper/35 text-center py-16">{t.packages.empty}</p>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
              {localized.map((p, i) => (
                <div
                  key={p.id}
                  data-pcard
                  className={`w-full md:w-[320px] ${i === 1 ? "md:mt-0" : "md:mt-8"} p-6 flex flex-col gap-3.5`}
                >
                  <TickedBox accent={p.highlighted} className="p-6 flex flex-col gap-3.5 h-full">
                    <span className={`label ${p.highlighted ? "text-accent" : "text-paper/55"}`}>
                      {p.name}
                      {p.highlighted ? ` · ${t.packages.mostChosen}` : ""}
                    </span>
                    {p.tagline && <span className="text-sm text-paper/70">{p.tagline}</span>}
                    <span className="font-heading text-4xl">{formatPrice(p.price, p.currency)}</span>
                    {p.billingNote && <span className="label text-paper/35">{p.billingNote}</span>}
                    <ul className="flex flex-col gap-1.5 mt-1">
                      {p.features.map((f) => (
                        <li key={f} className="text-sm text-paper/70">
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-2">
                      {p.highlighted ? (
                        <LinkButton href="/contact">{t.packages.choose}</LinkButton>
                      ) : (
                        <Link href="/contact" className="label text-paper/35 hover:text-accent transition-colors">
                          {t.packages.chooseArrow}
                        </Link>
                      )}
                    </div>
                  </TickedBox>
                </div>
              ))}
            </div>
          )}
        </Reveal>

        {featureRows.length > 0 && (
          <Reveal
            as={Section}
            run={(r) => playStaggerReveal(r, "[data-trow]", { translateY: 12, duration: 400, stagger: 40, easing: "easeOutQuad" })}
          >
            <SectionHeader eyebrow={t.table.eyebrow} />
            <div className="border border-paper/10 overflow-x-auto">
              <div
                className="grid min-w-[560px]"
                style={{ gridTemplateColumns: `1.6fr repeat(${localized.length}, 1fr)` }}
              >
                <div className="label text-paper p-3.5">{t.table.featureHeader}</div>
                {localized.map((p) => (
                  <div key={p.id} className="label text-paper p-3.5">
                    {p.name}
                  </div>
                ))}
              </div>
              {featureRows.map((feature) => (
                <div
                  data-trow
                  key={feature}
                  className="grid min-w-[560px] border-t border-paper/10"
                  style={{ gridTemplateColumns: `1.6fr repeat(${localized.length}, 1fr)` }}
                >
                  <div className="label text-paper/85 p-3.5">{feature}</div>
                  {localized.map((p) => (
                    <div key={p.id} className="label text-paper/55 p-3.5">
                      {p.features.includes(feature) ? "●" : "—"}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        )}

        <Section>
          <SectionHeader eyebrow={t.ongoing.eyebrow} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-paper/10">
            <div className="bg-ink p-5.5 flex flex-col gap-3">
              <span className="label text-accent">{t.ongoing.hostingLabel}</span>
              <span className="font-heading text-2xl">{t.ongoing.hostingTitle}</span>
              {t.ongoing.hostingTiers.map((tier) => (
                <div key={tier} className="flex justify-between">
                  <span className="label text-paper/85">{tier}</span>
                  <span className="label text-paper/55">₮ — {t.ongoing.perMonth}</span>
                </div>
              ))}
            </div>
            <div className="bg-ink p-5.5 flex flex-col gap-3">
              <span className="label text-accent">{t.ongoing.supportLabel}</span>
              <span className="font-heading text-2xl">{t.ongoing.supportTitle}</span>
              {t.ongoing.supportTiers.map((tier) => (
                <div key={tier} className="flex justify-between">
                  <span className="label text-paper/85">{tier}</span>
                  <span className="label text-paper/55">₮ — {t.ongoing.perMonth}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section>
          <SectionHeader eyebrow={t.faq.eyebrow} />
          <div className="flex flex-col gap-px bg-paper/10">
            {t.faq.items.map((item) => (
              <details key={item.q} className="bg-ink group p-4">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                  <span className="font-heading font-semibold text-[15px] leading-tight">{item.q}</span>
                  <span className="label text-accent group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-paper/70 mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="label text-paper/55">
            {t.faq.notOnList}{" "}
            <Link href="/contact" className="hover:text-accent transition-colors">
              {t.faq.askDirectly}
            </Link>
          </p>
        </Section>

        <CtaBand kicker={t.cta.kicker} heading={t.cta.heading} cta={t.cta.cta} href="/contact" />
      </main>

      <SiteFooter />
    </>
  );
}
