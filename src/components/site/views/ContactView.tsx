"use client";

import { useState } from "react";
import NavBar from "@/components/site/NavBar";
import SiteFooter from "@/components/site/SiteFooter";
import GhostText from "@/components/site/GhostText";
import TickedBox from "@/components/site/TickedBox";
import PhotoPlate from "@/components/site/PhotoPlate";
import Section, { SectionHeader } from "@/components/site/Section";
import Reveal from "@/components/site/Reveal";
import { ActionButton } from "@/components/site/Button";
import { playHero, playFieldStagger } from "@/lib/motion";
import { useCopy } from "@/components/site/i18n/ContentProvider";
import { contact } from "@/lib/i18n/contact";
import { apiPost, ApiError } from "@/lib/api/public";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`label px-3.5 py-2.5 border transition-colors ${
        active ? "border-accent text-accent" : "border-paper/20 text-paper/55 hover:border-paper/40"
      }`}
    >
      {children}
    </button>
  );
}

function toggle(set: Set<number>, index: number) {
  const next = new Set(set);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return next;
}

function BriefForm({ t }: { t: (typeof contact)["en"]["form"] }) {
  // Selections are keyed by index, not label text, so they survive a language switch mid-form.
  const [needs, setNeeds] = useState<Set<number>>(new Set([0]));
  const [devParts, setDevParts] = useState<Set<number>>(new Set([4]));
  const [budget, setBudget] = useState(1);
  const [timeline, setTimeline] = useState(2);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-heading text-2xl">{t.confirmedTitle}</span>
        <p className="text-sm text-paper/70">{t.confirmedBody}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const details = String(data.get("details") ?? "").trim();

    // The real Quote model (POST /public/quotes) has no fields for
    // needs/devParts/phone, so fold them into the free-text message instead
    // of dropping them. Canonical English labels go to the backend
    // regardless of UI language, keeping stored leads consistent.
    const en = contact.en.form;
    const needLabels = Array.from(needs).map((i) => en.needs[i]);
    const devPartLabels = Array.from(devParts).map((i) => en.devParts[i]);
    const messageLines = [
      needLabels.length ? `Needs: ${needLabels.join(", ")}` : null,
      devPartLabels.length ? `Development parts: ${devPartLabels.join(", ")}` : null,
      phone ? `Phone: ${phone}` : null,
      details || null,
    ].filter(Boolean);

    setSubmitting(true);
    try {
      await apiPost("/public/quotes", {
        name,
        email,
        company_name: company || undefined,
        budget: en.budgets[budget],
        timeline: en.timelines[timeline],
        message: messageLines.length ? messageLines.join("\n") : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errorFallback);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <div data-field-group>
        <span className="label text-paper/70 block mb-2">{t.needQuestion}</span>
        <div className="flex gap-2 flex-wrap">
          {t.needs.map((n, i) => (
            <Chip key={n} active={needs.has(i)} onClick={() => setNeeds((s) => toggle(s, i))}>
              {n}
            </Chip>
          ))}
        </div>
      </div>

      {needs.has(0) && (
        <div data-field-group>
          <span className="label text-paper/70 block mb-2">{t.devQuestion}</span>
          <div className="flex gap-2 flex-wrap">
            {t.devParts.map((n, i) => (
              <Chip key={n} active={devParts.has(i)} onClick={() => setDevParts((s) => toggle(s, i))}>
                {n}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div data-field-group>
          <label className="label text-paper/70 block mb-1.5" htmlFor="c-name">
            {t.name}
          </label>
          <input id="c-name" name="name" required className="w-full h-10 bg-transparent border border-paper/20 px-3 text-sm focus:border-accent outline-none" />
        </div>
        <div data-field-group>
          <label className="label text-paper/70 block mb-1.5" htmlFor="c-company">
            {t.company}
          </label>
          <input id="c-company" name="company" className="w-full h-10 bg-transparent border border-paper/20 px-3 text-sm focus:border-accent outline-none" />
        </div>
        <div data-field-group>
          <label className="label text-paper/70 block mb-1.5" htmlFor="c-email">
            {t.email}
          </label>
          <input id="c-email" name="email" type="email" required className="w-full h-10 bg-transparent border border-paper/20 px-3 text-sm focus:border-accent outline-none" />
        </div>
        <div data-field-group>
          <label className="label text-paper/70 block mb-1.5" htmlFor="c-phone">
            {t.phone}
          </label>
          <input id="c-phone" name="phone" type="tel" className="w-full h-10 bg-transparent border border-paper/20 px-3 text-sm focus:border-accent outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div data-field-group>
          <span className="label text-paper/70 block mb-2">{t.budgetLabel}</span>
          <div className="flex gap-2 flex-wrap">
            {t.budgets.map((n, i) => (
              <Chip key={n} active={budget === i} onClick={() => setBudget(i)}>
                {n}
              </Chip>
            ))}
          </div>
        </div>
        <div data-field-group>
          <span className="label text-paper/70 block mb-2">{t.timelineLabel}</span>
          <div className="flex gap-2 flex-wrap">
            {t.timelines.map((n, i) => (
              <Chip key={n} active={timeline === i} onClick={() => setTimeline(i)}>
                {n}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div data-field-group>
        <label className="label text-paper/70 block mb-1.5" htmlFor="c-details">
          {t.details}
        </label>
        <textarea id="c-details" name="details" rows={4} className="w-full bg-transparent border border-paper/20 px-3 py-2 text-sm focus:border-accent outline-none resize-y" />
      </div>

      <div data-field-group>
        <label className="label text-paper/70 block mb-1.5" htmlFor="c-file">
          {t.attachmentLabel}
        </label>
        <input
          id="c-file"
          type="file"
          className="block w-full text-sm text-paper/55 border border-dashed border-paper/30 px-3.5 py-3 file:mr-3 file:label file:bg-transparent file:border-0 file:text-accent file:cursor-pointer"
        />
        <span className="label text-paper/35 block mt-1.5">{t.attachmentHint}</span>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <div className="flex gap-3.5 items-center flex-wrap">
        <ActionButton type="submit" disabled={submitting}>
          {submitting ? t.sending : t.send}
        </ActionButton>
        <span className="label text-paper/55">{t.replyNote}</span>
      </div>
    </form>
  );
}

export default function ContactView() {
  const t = useCopy(contact, "contact");

  return (
    <>
      <NavBar />

      <main className="flex-1">
        <Reveal
          as="section"
          run={playHero}
          trigger="mount"
          className="relative overflow-hidden border-b border-paper/10 h-[420px] md:h-[480px]"
        >
          <div className="photo-plate absolute inset-0" aria-hidden="true" />
          <GhostText>{t.ghost}</GhostText>

          <div className="absolute inset-x-0 top-[28%] flex flex-col items-center gap-1.5 px-4 z-10">
            {t.hero.heading.map((line) => (
              <h1 key={line} className="reveal-mask text-center">
                <span data-reveal-line className="block text-[8vw] leading-none tracking-tight sm:text-[46px] md:text-[68px]">
                  {line}
                </span>
              </h1>
            ))}
          </div>

          <div className="hidden lg:flex flex-col gap-4 absolute left-8 top-14 w-48 text-right z-10">
            <span data-label className="label text-paper/35">
              {t.hero.labels.noSales[0]}
              <br />
              {t.hero.labels.noSales[1]}
            </span>
            <span data-label className="label text-paper/85">
              {t.hero.labels.realEngineer[0]}
              <br />
              {t.hero.labels.realEngineer[1]}
            </span>
          </div>
          <div className="hidden lg:flex flex-col gap-4 absolute right-8 top-16 w-52 z-10">
            <span data-label className="label text-paper/85">
              {t.hero.labels.oneDay[0]}
              <br />
              {t.hero.labels.oneDay[1]}
            </span>
            <span data-label className="label text-paper/35">
              {t.hero.labels.alreadySite[0]}
              <br />
              {t.hero.labels.alreadySite[1]}
            </span>
          </div>

          <TickedBox
            data-label
            className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[92%] max-w-[560px] px-6 py-5 z-10 bg-ink/40 backdrop-blur-sm"
          >
            <p className="label text-paper/70 text-center leading-loose">{t.hero.description}</p>
          </TickedBox>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] border-b border-paper/10">
          <Reveal
            as="div"
            run={playFieldStagger}
            className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-paper/10 flex flex-col gap-5"
          >
            <SectionHeader eyebrow={t.form.eyebrow} />
            <BriefForm t={t.form} />
          </Reveal>

          <div className="flex flex-col">
            <div className="p-6 md:p-8 border-b border-paper/10 flex flex-col gap-4">
              <span className="label text-paper">{t.direct.eyebrow}</span>
              <div>
                <span className="label text-paper/35">{t.direct.email}</span>
                <a
                  href="mailto:munkherdene.ts9234@gmail.com"
                  className="block font-heading text-xl md:text-2xl mt-1.5 hover:text-accent transition-colors"
                >
                  munkherdene.ts9234@gmail.com
                </a>
              </div>
              <div>
                <span className="label text-paper/35">{t.direct.phone}</span>
                <a
                  href="tel:+97694042845"
                  className="block font-heading text-xl md:text-2xl mt-1.5 hover:text-accent transition-colors"
                >
                  +976 9404 2845
                </a>
              </div>
              <p className="label text-paper/35">{t.direct.note}</p>
            </div>
            <div className="p-6 md:p-8 border-b border-paper/10 flex flex-col gap-3">
              <span className="label text-paper">{t.office.eyebrow}</span>
              <p className="font-heading text-lg">{t.office.address}</p>
              <div>
                <span className="label text-paper/35">{t.office.hoursLabel}</span>
                <p className="label text-paper/85 mt-1">{t.office.hoursValue}</p>
              </div>
              <div>
                <span className="label text-paper/35">{t.office.supportLabel}</span>
                <p className="label text-paper/85 mt-1">{t.office.supportValue}</p>
              </div>
            </div>
            <PhotoPlate label={t.office.mapLabel} className="flex-1 min-h-[200px] m-4" />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
