"use client";

import { useState } from "react";
import NavBar from "@/components/site/NavBar";
import SiteFooter from "@/components/site/SiteFooter";
import CtaBand from "@/components/site/CtaBand";
import GhostText from "@/components/site/GhostText";
import TickedBox from "@/components/site/TickedBox";
import Section, { SectionHeader } from "@/components/site/Section";
import Reveal from "@/components/site/Reveal";
import { ActionButton } from "@/components/site/Button";
import { playHero, playCountUp, playStaggerReveal } from "@/lib/motion";
import { useCopy } from "@/components/site/i18n/ContentProvider";
import { review } from "@/lib/i18n/review";

const reviews = [
  { stars: 5 },
  { stars: 5 },
  { stars: 4 },
  { stars: 5 },
  { stars: 5 },
  { stars: 5 },
];

function Stars({ count, size = "text-base" }: { count: number; size?: string }) {
  return (
    <span className={`text-accent ${size}`}>
      {"★".repeat(count)}
      <span className="text-paper/20">{"★".repeat(5 - count)}</span>
    </span>
  );
}

function ReviewForm({ t }: { t: (typeof review)["en"]["form"] }) {
  const [rating, setRating] = useState(3);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-heading text-xl">{t.thanks}</span>
        <p className="text-sm text-paper/70">{t.queued}</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div>
        <label className="label text-paper/70 block mb-1.5" htmlFor="review-name">
          {t.name}
        </label>
        <input id="review-name" required className="w-full h-10 bg-transparent border border-paper/20 px-3 text-sm focus:border-accent outline-none" />
      </div>
      <div>
        <label className="label text-paper/70 block mb-1.5" htmlFor="review-company">
          {t.company}
        </label>
        <input id="review-company" className="w-full h-10 bg-transparent border border-paper/20 px-3 text-sm focus:border-accent outline-none" />
      </div>
      <div>
        <span className="label text-paper/70 block mb-1.5">{t.rating}</span>
        <div className="flex gap-2" role="radiogroup" aria-label={t.rating}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              onClick={() => setRating(n)}
              className={`text-xl transition-transform hover:scale-125 ${n <= rating ? "text-accent" : "text-paper/20"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label text-paper/70 block mb-1.5" htmlFor="review-text">
          {t.yourReview}
        </label>
        <textarea id="review-text" required rows={4} className="w-full bg-transparent border border-paper/20 px-3 py-2 text-sm focus:border-accent outline-none resize-y" />
      </div>
      <ActionButton type="submit" className="self-start">
        {t.submit}
      </ActionButton>
    </form>
  );
}

export default function ReviewView() {
  const t = useCopy(review, "review");

  return (
    <>
      <NavBar />

      <main className="flex-1">
        <Reveal
          as="section"
          run={[playHero, playCountUp]}
          trigger="mount"
          className="relative overflow-hidden border-b border-paper/10 min-h-[540px] py-16"
        >
          <div className="photo-plate absolute inset-0" aria-hidden="true" />
          <GhostText>{t.ghost}</GhostText>

          <div className="relative z-10 flex flex-col items-center gap-5 px-8 md:px-24 pt-6">
            <span className="label text-accent">{t.hero.featured}</span>
            <h1 className="reveal-mask text-center">
              <span
                data-reveal-line
                className="block font-heading font-bold text-[26px] md:text-[40px] leading-[1.3] tracking-tight max-w-3xl"
              >
                {t.hero.quote}
              </span>
            </h1>
            <span className="label text-paper/55">{t.hero.byline}</span>
          </div>

          <div className="hidden lg:flex flex-col gap-4 absolute left-8 top-14 w-48 text-right z-10">
            <span data-label className="label text-paper/35">
              {t.hero.labels.collected[0]}
              <br />
              {t.hero.labels.collected[1]}
            </span>
            <span data-label className="label text-paper/85">
              {t.hero.labels.verified[0]}
              <br />
              {t.hero.labels.verified[1]}
            </span>
          </div>
          <div className="hidden lg:flex flex-col gap-4 absolute right-8 top-16 w-52 z-10">
            <span data-label className="label text-paper/85">
              {t.hero.labels.notCurated[0]}
              <br />
              {t.hero.labels.notCurated[1]}
            </span>
            <span data-label className="label text-paper/35">
              {t.hero.labels.supportStart[0]}
              <br />
              {t.hero.labels.supportStart[1]}
            </span>
          </div>

          <TickedBox className="relative z-10 mx-auto mt-10 w-[280px] px-6 py-4.5 flex items-baseline justify-between gap-4">
            <span className="font-heading text-4xl">
              <span data-count="49" data-decimal="true">
                4.9
              </span>
            </span>
            <span className="label text-paper/55 text-right">
              {t.hero.averageOf}
              <br />
              <span data-count="12">12</span> {t.hero.reviewsSuffix}
            </span>
          </TickedBox>
        </Reveal>

        <Reveal
          as={Section}
          run={(r) => playStaggerReveal(r, "[data-qcard]", { translateY: 28, duration: 600, stagger: 70, easing: "easeOutQuad" })}
        >
          <SectionHeader eyebrow={t.list.eyebrow} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper/10">
            {reviews.map((r, i) => (
              <div key={i} data-qcard className="bg-ink p-5.5 flex flex-col gap-3">
                <Stars count={r.stars} />
                <p className="text-sm text-paper/55 italic">{t.list.placeholder}</p>
                <span className="label text-paper/35 mt-1.5">{t.list.nameCompany}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span className="label text-paper/35">{t.list.showing}</span>
            <ActionButton variant="outline">{t.list.loadMore}</ActionButton>
          </div>
        </Reveal>

        <Section>
          <SectionHeader eyebrow={t.form.eyebrow} />
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-px bg-paper/10">
            <div className="bg-ink p-6">
              <ReviewForm t={t.form} />
            </div>
            <div className="bg-ink p-6 flex flex-col gap-3">
              <span className="label text-accent">{t.form.moderationLabel}</span>
              <p className="font-heading text-xl">{t.form.moderationTitle}</p>
              <p className="text-sm text-paper/55">{t.form.moderationBody}</p>
            </div>
          </div>
        </Section>

        <CtaBand kicker={t.cta.kicker} heading={t.cta.heading} cta={t.cta.cta} href="/contact" />
      </main>

      <SiteFooter />
    </>
  );
}
