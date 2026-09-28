"use client";

import Link from "next/link";
import NavBar from "@/components/site/NavBar";
import SiteFooter from "@/components/site/SiteFooter";
import PhotoPlate from "@/components/site/PhotoPlate";
import Section, { SectionHeader } from "@/components/site/Section";
import Reveal from "@/components/site/Reveal";
import { localizeProject, type Project } from "@/lib/projects";
import { playStaggerReveal } from "@/lib/motion";
import { useLang } from "@/components/site/i18n/LanguageProvider";
import { useCopy } from "@/components/site/i18n/ContentProvider";
import { caseStudy } from "@/lib/i18n/caseStudy";

export default function CaseStudyView({
  project: rawProject,
  nextProject: rawNextProject,
}: {
  project: Project;
  nextProject: Project;
}) {
  const { lang } = useLang();
  const t = useCopy(caseStudy, "caseStudy");
  const project = localizeProject(rawProject, lang);
  const nextProject = localizeProject(rawNextProject, lang);

  return (
    <>
      <NavBar />

      <div className="px-6 md:px-11 py-3.5 border-b border-paper/10">
        <Link href="/our-projects" className="label text-paper/55 hover:text-accent transition-colors">
          {t.back}
        </Link>
      </div>

      <main className="flex-1">
        <div className="px-6 py-10 md:px-11 md:py-12 border-b border-paper/10 flex flex-col gap-4">
          <span className="label text-paper/55">
            {project.category} · {project.year}
          </span>
          <h1 className="text-[13vw] leading-none tracking-tight sm:text-[52px]">{project.name}</h1>
          {project.tagline && <p className="label text-accent">{project.tagline}</p>}
          {project.description && (
            <p className="text-[15px] text-paper/70 max-w-xl leading-relaxed">{project.description}</p>
          )}
        </div>

        <PhotoPlate
          label={t.photoLabel}
          imageUrl={project.coverImage?.url}
          alt={project.coverImage?.caption}
          className="h-[300px] md:h-[380px] border-b border-paper/10"
        />

        <Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper/10">
            <div className="bg-ink p-4">
              <span className="label text-paper/55">{t.meta.category}</span>
              <p className="label text-paper mt-1.5">{project.category}</p>
            </div>
            <div className="bg-ink p-4">
              <span className="label text-paper/55">{t.meta.year}</span>
              <p className="label text-paper mt-1.5">{project.year}</p>
            </div>
            <div className="bg-ink p-4">
              <span className="label text-paper/55">{t.meta.liveSite}</span>
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label text-accent mt-1.5 block hover:underline"
                >
                  {t.meta.visit}
                </a>
              ) : (
                <p className="label text-paper mt-1.5">—</p>
              )}
            </div>
          </div>
        </Section>

        <Reveal
          as={Section}
          run={(r) => playStaggerReveal(r, "[data-shot]", { translateY: 24, duration: 700, stagger: 100, settlePlates: true })}
        >
          <SectionHeader eyebrow={t.screens.eyebrow} />
          {project.images.length === 0 ? (
            <p className="label text-paper/35">{t.screens.empty}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-paper/10">
              {project.images.map((img, i) => (
                <div data-shot key={i}>
                  <PhotoPlate label={img.caption || t.screens.eyebrow} imageUrl={img.url} alt={img.caption} className="h-[200px]" />
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <Section>
          <SectionHeader eyebrow={t.result.eyebrow} />
          {project.metrics.length === 0 ? (
            <p className="label text-paper/35">{t.result.empty}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper/10">
              {project.metrics.map((m, i) => (
                <div key={i} className="bg-ink p-4">
                  <span className="font-heading text-3xl">{m.value}</span>
                  <p className="label text-paper/55 mt-1.5">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Link
          href={`/our-projects/${nextProject.slug}`}
          className="bg-accent text-on-accent hover:bg-accent-dark transition-colors px-6 py-11 md:px-11 flex items-center justify-between gap-4"
        >
          <span className="font-heading text-[clamp(24px,4vw,38px)] leading-none">{t.nextProject}</span>
          <span className="font-heading text-[clamp(24px,4vw,38px)] leading-none">→</span>
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}
