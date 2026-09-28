import anime from "animejs";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Mask-reveal headline/sub/cta lines: translateY 110%→0 + fade, read-order stagger.
 * Targets elements matching `[data-reveal-line]` inside root. */
export function revealLines(root: ParentNode, opts: { delay?: number } = {}) {
  const lines = root.querySelectorAll<HTMLElement>("[data-reveal-line]");
  if (!lines.length || prefersReducedMotion()) {
    lines.forEach((el) => {
      el.style.transform = "none";
      el.style.opacity = "1";
    });
    return;
  }
  anime.set(lines, { translateY: "110%", opacity: 0 });
  anime({
    targets: lines,
    translateY: "0%",
    opacity: 1,
    duration: 900,
    delay: anime.stagger(90, { start: opts.delay ?? 0 }),
    easing: "cubicBezier(.16,1,.3,1)",
  });
}

/** Rotate + scale a small mark/logo into place. Targets `[data-mark]`. */
export function revealMark(root: ParentNode) {
  const mark = root.querySelector<HTMLElement>("[data-mark]");
  if (!mark || prefersReducedMotion()) return;
  anime({
    targets: mark,
    rotate: [-90, 0],
    scale: [0.4, 1],
    duration: 1100,
    easing: "spring(1, 80, 12, 0)",
  });
}

/** Scattered mono label clusters fade in and settle from alternating sides.
 * Targets `[data-label]`. */
export function revealLabels(root: ParentNode, opts: { start?: number } = {}) {
  const labels = root.querySelectorAll<HTMLElement>("[data-label]");
  if (!labels.length) return;
  if (prefersReducedMotion()) {
    labels.forEach((el) => (el.style.opacity = "1"));
    return;
  }
  anime.set(labels, {
    opacity: 0,
    translateX: (_el: HTMLElement, i: number) => (i % 2 ? 14 : -14),
  });
  anime({
    targets: labels,
    opacity: 1,
    translateX: 0,
    duration: 700,
    delay: anime.stagger(45, { start: opts.start ?? 500 }),
    easing: "easeOutQuad",
  });
}

/** Large background ghost wordmark settles upward on load. Targets `[data-ghost]`. */
export function revealGhost(root: ParentNode) {
  const ghost = root.querySelector<HTMLElement>("[data-ghost]");
  if (!ghost || prefersReducedMotion()) return;
  anime.set(ghost, { translateY: 40 });
  anime({
    targets: ghost,
    translateY: 0,
    duration: 1600,
    easing: "easeOutQuart",
  });
}

/** Runs the full dark hero sequence: headline lines, mark, labels, ghost wordmark. */
export function playHero(root: ParentNode) {
  revealLines(root, { delay: 200 });
  revealMark(root);
  revealLabels(root, { start: 500 });
  revealGhost(root);
}

/** Count 0 → target on elements with data-count(+data-suffix, data-decimal). */
export function playCountUp(root: ParentNode) {
  const counters = root.querySelectorAll<HTMLElement>("[data-count]");
  counters.forEach((el, i) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? "";
    const decimal = el.dataset.decimal === "true";
    if (prefersReducedMotion()) {
      el.textContent = (decimal ? (target / 10).toFixed(1) : String(target)) + suffix;
      return;
    }
    const o = { v: 0 };
    el.textContent = (decimal ? "0.0" : "0") + suffix;
    anime({
      targets: o,
      v: target,
      round: 1,
      duration: 1400,
      delay: i * 120,
      easing: "easeOutExpo",
      update: () => {
        el.textContent = (decimal ? (o.v / 10).toFixed(1) : String(o.v)) + suffix;
      },
    });
  });
}

/** Generic staggered translateY + fade reveal for cards/rows/panels.
 * Optionally settles a nested `.photo-plate` from a slight overscale. */
export function playStaggerReveal(
  root: ParentNode,
  selector: string,
  opts: {
    translateY?: number;
    duration?: number;
    stagger?: number;
    easing?: string;
    settlePlates?: boolean;
  } = {}
) {
  const items = root.querySelectorAll<HTMLElement>(selector);
  if (!items.length) return;
  const {
    translateY = 40,
    duration = 800,
    stagger = 120,
    easing = "cubicBezier(.16,1,.3,1)",
    settlePlates = false,
  } = opts;
  if (prefersReducedMotion()) {
    items.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }
  anime.set(items, { translateY, opacity: 0 });
  anime({
    targets: items,
    translateY: 0,
    opacity: 1,
    duration,
    delay: anime.stagger(stagger),
    easing,
  });
  if (settlePlates) {
    const plates = root.querySelectorAll(`${selector} .photo-plate`);
    if (plates.length) {
      anime.set(plates, { scale: 1.06 });
      anime({
        targets: plates,
        scale: 1,
        duration: 1200,
        delay: anime.stagger(stagger),
        easing: "easeOutQuart",
      });
    }
  }
}

/** Chips/tech-stack tiles assemble in from random scattered offsets. Targets `[data-chip]`. */
export function playAssemble(root: ParentNode) {
  const chips = root.querySelectorAll<HTMLElement>("[data-chip]");
  if (!chips.length) return;
  if (prefersReducedMotion()) {
    chips.forEach((el) => (el.style.opacity = "1"));
    return;
  }
  chips.forEach((c) =>
    anime.set(c, {
      translateX: anime.random(-160, 160),
      translateY: anime.random(-80, 80),
      opacity: 0,
    })
  );
  anime({
    targets: chips,
    translateX: 0,
    translateY: 0,
    opacity: 1,
    duration: 900,
    delay: anime.stagger(45),
    easing: "cubicBezier(.2,1,.3,1)",
  });
}

/** Form field groups stagger in. Targets `[data-field-group]`. */
export function playFieldStagger(root: ParentNode) {
  const groups = root.querySelectorAll<HTMLElement>("[data-field-group]");
  if (!groups.length) return;
  if (prefersReducedMotion()) {
    groups.forEach((el) => (el.style.opacity = "1"));
    return;
  }
  anime.set(groups, { translateY: 16, opacity: 0 });
  anime({
    targets: groups,
    translateY: 0,
    opacity: 1,
    duration: 450,
    delay: anime.stagger(60),
    easing: "easeOutQuad",
  });
}
