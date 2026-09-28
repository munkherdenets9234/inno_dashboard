"use client";

import Link from "next/link";
import NavBar from "@/components/site/NavBar";
import SiteFooter from "@/components/site/SiteFooter";
import CtaBand from "@/components/site/CtaBand";
import GhostText from "@/components/site/GhostText";
import PhotoPlate from "@/components/site/PhotoPlate";
import TickedBox from "@/components/site/TickedBox";
import StatCounter from "@/components/site/StatCounter";
import Section, { SectionHeader } from "@/components/site/Section";
import Reveal from "@/components/site/Reveal";
import { LinkButton } from "@/components/site/Button";
import { localizeProject, type Project } from "@/lib/projects";
import { localizePackage, formatPrice, type Package } from "@/lib/site-packages";
import { playHero, playStaggerReveal, playCountUp, playAssemble } from "@/lib/motion";
import { useLang } from "@/components/site/i18n/LanguageProvider";
import { useCopy } from "@/components/site/i18n/ContentProvider";
import { home } from "@/lib/i18n/home";

const stack = ["React", "Next", "Node", "PostgreSQL", "Docker", "Figma"];

export default function HomeView({ projects, packages }: { projects: Project[]; packages: Package[] }) {
  const { lang } = useLang();
  const t = useCopy(home, "home");
  const localized = projects.map((p) => localizeProject(p, lang));
  const [first, second] = localized;
  const localizedPackages = packages.map((p) => localizePackage(p, lang));

  const services = [
    { n: t.services.hosting.n, title: t.services.hosting.title, body: t.services.hosting.body },
    { n: t.services.development.n, title: t.services.development.title, rows: t.services.development.rows },
    { n: t.services.support.n, title: t.services.support.title, body: t.services.support.body },
  ];

  return (
    <>
      <NavBar />

      <main className="flex-1">
        {/* Hero */}
        <Reveal
          as="section"
          run={playHero}
          trigger="mount"
          className="relative overflow-hidden border-b border-paper/10 h-[600px] md:h-[700px]"
        >
          <div className="photo-plate absolute inset-0" aria-hidden="true" />
          <PhotoPlate
            label="Full-bleed landscape photo · grayscale · horizon sits behind the wordmark"
            className="absolute inset-x-0 bottom-0 h-[36%]"
          />

          <GhostText>INNO NOMADS</GhostText>

          <div className="absolute left-1/2 top-[24%] -translate-x-1/2 flex flex-col items-center gap-3 z-0">
            <div className="photo-plate w-[170px] h-[170px] md:w-[220px] md:h-[220px] rounded-full border border-paper/20" />
            <span className="label text-paper/35">{t.hero.markCaption}</span>
          </div>

          <div className="absolute inset-x-0 top-[26%] flex justify-center px-4 z-10">
            <h1 className="reveal-mask text-center">
              <span
                data-reveal-line
                className="block text-[15vw] leading-none tracking-tight sm:text-[76px] md:text-[104px]"
              >
                INNO NOMADS
              </span>
            </h1>
          </div>

          <div className="hidden lg:flex flex-col gap-4 absolute left-8 top-12 w-52 text-right z-10">
            <span data-label className="label text-paper/35">
              {t.hero.labels.builtFor[0]}
              <br />
              {t.hero.labels.builtFor[1]}
            </span>
            <span data-label className="label text-paper/85">
              {t.hero.labels.designMeets[0]}
              <br />
              {t.hero.labels.designMeets[1]}
            </span>
          </div>
          <div className="hidden xl:flex flex-col gap-3 absolute left-44 top-16 w-44 text-right z-10">
            <span data-label className="label text-paper/35">
              {t.hero.labels.designBuild[0]}
              <br />
              {t.hero.labels.designBuild[1]}
            </span>
            <span data-label className="label text-paper/85">
              {t.hero.labels.oneTeam[0]}
              <br />
              {t.hero.labels.oneTeam[1]}
            </span>
          </div>
          <div className="hidden lg:flex flex-col gap-4 absolute right-8 top-[22%] w-56 z-10">
            <span data-label className="label text-paper/35">
              {t.hero.labels.notJust[0]}
              <br />
              {t.hero.labels.notJust[1]}
            </span>
            <span data-label className="label text-paper/85">
              {t.hero.labels.weHost}
            </span>
            <span data-label className="label text-paper/35">
              {t.hero.labels.supportAnswers}
            </span>
            <span data-label className="label text-paper/85">
              {t.hero.labels.smallTeam[0]}
              <br />
              {t.hero.labels.smallTeam[1]}
            </span>
          </div>

          <TickedBox
            data-label
            className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[92%] max-w-[560px] px-6 py-5 z-10 bg-ink/40 backdrop-blur-sm"
          >
            <p className="label text-paper/70 text-center leading-loose">{t.hero.description}</p>
          </TickedBox>
        </Reveal>

        {/* Services */}
        <Reveal
          as={Section}
          run={(r) =>
            playStaggerReveal(r, "[data-svc]", { translateY: 24, duration: 600, stagger: 100 })
          }
        >
          <SectionHeader eyebrow={t.services.eyebrow} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper/10">
            {services.map((s) => (
              <div key={s.title} data-svc className="bg-ink p-6 flex flex-col gap-3.5 min-h-[220px]">
                <span className="label text-accent">{s.n}</span>
                <span className="font-heading text-2xl">{s.title}</span>
                {s.body ? (
                  <p className="text-sm text-paper/70 leading-relaxed">{s.body}</p>
                ) : (
                  <div className="flex flex-col gap-px bg-paper/10 mt-1">
                    {s.rows!.map((row) => (
                      <div key={row} className="bg-ink py-2.5">
                        <span className="label text-paper/85">{row}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* Stats */}
        <Reveal as={Section} run={playCountUp}>
          <SectionHeader eyebrow={t.stats.eyebrow} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-paper/10">
            <div className="bg-ink p-5">
              <StatCounter value={4} label={t.stats.weeksToLaunch} />
            </div>
            <div className="bg-ink p-5">
              <StatCounter value={99} suffix=".9%" label={t.stats.hostingUptime} />
            </div>
            <div className="bg-ink p-5">
              <StatCounter value={24} suffix="/7" label={t.stats.supportWindow} />
            </div>
          </div>
        </Reveal>

        {/* Selected work */}
        <Reveal
          as={Section}
          run={(r) =>
            playStaggerReveal(r, "[data-work]", {
              translateY: 60,
              duration: 1000,
              stagger: 120,
              settlePlates: true,
            })
          }
        >
          <SectionHeader eyebrow={t.work.eyebrow} />
          {!first ? (
            <p className="label text-paper/35 text-center py-16">{t.work.empty}</p>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center">
              <Link
                href={`/our-projects/${first.slug}`}
                data-work
                className="w-full max-w-[300px] md:mt-16 flex flex-col gap-3 group"
              >
                <PhotoPlate
                  label={`${t.work.projectShot} · ${first.category}`}
                  imageUrl={first.coverImage?.url}
                  alt={first.coverImage?.caption}
                  className="h-[170px]"
                />
                <span className="label text-paper/70 text-right group-hover:text-accent transition-colors">
                  {first.category} · {first.year}
                  <br />
                  {first.tagline}
                </span>
              </Link>
              {second && (
                <div className="w-full max-w-[400px] flex flex-col gap-3">
                  <span className="label text-paper/70 text-center">
                    {t.work.moreLive[0]}
                    <br />
                    {t.work.moreLive[1]}
                  </span>
                  <Link href={`/our-projects/${second.slug}`} data-work className="group flex flex-col gap-3">
                    <PhotoPlate
                      label={t.work.heroPlate}
                      imageUrl={second.coverImage?.url}
                      alt={second.coverImage?.caption}
                      className="h-[230px]"
                    />
                    <span className="label text-paper/35 text-center group-hover:text-accent transition-colors">
                      {second.category} · {second.year} · {second.tagline}
                    </span>
                  </Link>
                </div>
              )}
              <Link
                href="/our-projects"
                data-work
                className="w-full max-w-[300px] md:mt-24 flex flex-col gap-3 group"
              >
                <PhotoPlate label={t.work.adminDetail} className="h-[140px]" />
                <span className="label text-paper/35 group-hover:text-accent transition-colors">
                  {t.work.everyBuild[0]}
                  <br />
                  {t.work.everyBuild[1]}
                </span>
              </Link>
            </div>
          )}
        </Reveal>

        {/* Stack */}
        <Reveal as={Section} run={playAssemble}>
          <SectionHeader eyebrow={t.stack.eyebrow} />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-paper/10">
            {stack.map((s) => (
              <div key={s} data-chip className="bg-ink h-16 flex items-center justify-center">
                <span className="label text-paper/85">{s}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Packages teaser */}
        <Reveal
          as={Section}
          run={(r) =>
            playStaggerReveal(r, "[data-pkg]", { translateY: 40, duration: 700, stagger: 90 })
          }
        >
          <SectionHeader
            eyebrow={t.packages.eyebrow}
            action={
              <LinkButton href="/price" variant="outline">
                {t.packages.seeFullPricing}
              </LinkButton>
            }
          />
          {localizedPackages.length === 0 ? (
            <p className="label text-paper/35 text-center py-8">{t.packages.empty}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper/10">
              {localizedPackages.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  data-pkg
                  className={`bg-ink p-5 flex flex-col gap-2.5 ${
                    p.highlighted ? "outline outline-accent -outline-offset-1" : ""
                  }`}
                >
                  <span className="label text-accent">
                    {p.name}
                    {p.highlighted ? ` · ${t.packages.mostChosen}` : ""}
                  </span>
                  <span className="font-heading text-3xl">{formatPrice(p.price, p.currency)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="label text-paper/55">
            <Link href="/review" className="hover:text-accent transition-colors">
              {t.packages.readReviews}
            </Link>
          </p>
        </Reveal>

        <CtaBand kicker={t.cta.kicker} heading={t.cta.heading} cta={t.cta.cta} href="/contact" />
      </main>

      <SiteFooter />
    </>
  );
}
