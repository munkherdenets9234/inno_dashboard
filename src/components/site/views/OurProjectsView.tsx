"use client";

import Link from "next/link";
import NavBar from "@/components/site/NavBar";
import SiteFooter from "@/components/site/SiteFooter";
import CtaBand from "@/components/site/CtaBand";
import GhostText from "@/components/site/GhostText";
import PhotoPlate from "@/components/site/PhotoPlate";
import TickedBox from "@/components/site/TickedBox";
import Section, { SectionHeader } from "@/components/site/Section";
import Reveal from "@/components/site/Reveal";
import { LinkButton } from "@/components/site/Button";
import { localizeProject, type Project } from "@/lib/projects";
import { playHero, playStaggerReveal } from "@/lib/motion";
import { useLang } from "@/components/site/i18n/LanguageProvider";
import { useCopy } from "@/components/site/i18n/ContentProvider";
import { ourProjects } from "@/lib/i18n/ourProjects";

export default function OurProjectsView({ projects }: { projects: Project[] }) {
  const { lang } = useLang();
  const t = useCopy(ourProjects, "ourProjects");
  // The card layout below is a fixed two-slot design — only the first two
  // showcased projects (by sort_order, as returned by the API) are surfaced
  // here by design; the rest live on nothing yet (no "view all" beyond this
  // page since the catalog is still small).
  const [first, second] = projects.map((p) => localizeProject(p, lang));

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
              {t.hero.labels.liveClients[0]}
              <br />
              {t.hero.labels.liveClients[1]}
            </span>
            <span data-label className="label text-paper/85">
              {t.hero.labels.everyBuild[0]}
              <br />
              {t.hero.labels.everyBuild[1]}
            </span>
          </div>
          <div className="hidden lg:flex flex-col gap-4 absolute right-8 top-16 w-56 z-10">
            <span data-label className="label text-paper/85">
              {t.hero.labels.weHost[0]}
              <br />
              {t.hero.labels.weHost[1]}
            </span>
            <span data-label className="label text-paper/35">
              {t.hero.labels.takeovers[0]}
              <br />
              {t.hero.labels.takeovers[1]}
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
          run={(r) => playStaggerReveal(r, "[data-wcard]", { translateY: 60, duration: 1000, stagger: 120, settlePlates: true })}
        >
          <SectionHeader eyebrow={t.caseStudies.eyebrow} />
          {!first ? (
            <p className="label text-paper/35 text-center py-16">{t.caseStudies.empty}</p>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center">
              <div data-wcard className="w-full max-w-[300px] md:mt-16 flex flex-col gap-3">
                <PhotoPlate label="Admin site detail" className="h-[160px]" />
                <span className="label text-paper/35 text-right">{t.caseStudies.supportingShot}</span>
              </div>

              <div data-wcard className="w-full max-w-[440px] flex flex-col gap-3.5">
                <span className="label text-accent text-center">
                  {first.category} · {first.year}
                </span>
                <PhotoPlate
                  label="Project shot · hero plate"
                  imageUrl={first.coverImage?.url}
                  alt={first.coverImage?.caption}
                  className="h-[270px]"
                />
                <span className="font-heading text-3xl text-center">{first.name}</span>
                <p className="label text-paper/70 text-center leading-loose">{first.tagline}</p>
                <LinkButton href={`/our-projects/${first.slug}`} className="self-center">
                  {t.caseStudies.readCaseStudy}
                </LinkButton>
              </div>

              {second && (
                <div data-wcard className="w-full max-w-[300px] md:mt-10 flex flex-col gap-3">
                  <PhotoPlate
                    label="Project shot"
                    imageUrl={second.coverImage?.url}
                    alt={second.coverImage?.caption}
                    className="h-[190px]"
                  />
                  <span className="label text-paper/85">
                    {second.category} · {second.year}
                    <br />
                    {second.tagline}
                  </span>
                  <Link
                    href={`/our-projects/${second.slug}`}
                    className="label text-paper/35 hover:text-accent transition-colors"
                  >
                    {t.caseStudies.readCaseStudyArrow}
                  </Link>
                </div>
              )}
            </div>
          )}
        </Reveal>

        <Section>
          <SectionHeader eyebrow={t.inProgress.eyebrow} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper/10">
            <div className="bg-ink p-5.5">
              <span className="label text-accent">{t.inProgress.buildingLabel}</span>
              <p className="font-heading text-lg mt-2.5">{t.inProgress.buildingBody}</p>
            </div>
            <div className="bg-ink p-5.5">
              <span className="label text-accent">{t.inProgress.takeoversLabel}</span>
              <p className="font-heading text-lg mt-2.5">{t.inProgress.takeoversBody}</p>
            </div>
            <div className="bg-ink p-5.5 flex items-end">
              <LinkButton href="/contact" variant="outline">
                {t.inProgress.talkToUs}
              </LinkButton>
            </div>
          </div>
        </Section>

        <CtaBand kicker={t.cta.kicker} heading={t.cta.heading} cta={t.cta.cta} href="/contact" />
      </main>

      <SiteFooter />
    </>
  );
}
