"use client";

import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ElementType } from "react";

type MotionFn = (root: ParentNode) => void;

type RevealProps<T extends ElementType> = {
  as?: T;
  run: MotionFn | MotionFn[];
  trigger?: "mount" | "intersect";
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/**
 * Wraps a section and fires one or more motion.ts animations either
 * immediately on mount (above-the-fold hero) or the first time it
 * scrolls into view (everything below the fold).
 */
export default function Reveal<T extends ElementType = "div">({
  as,
  run,
  trigger = "intersect",
  children,
  ...rest
}: RevealProps<T>) {
  const Comp = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fns = Array.isArray(run) ? run : [run];
    const play = () => {
      if (played.current) return;
      played.current = true;
      fns.forEach((fn) => fn(el));
    };
    if (trigger === "mount") {
      play();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            play();
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
    // run/trigger are stable per call site — only wire the observer once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Comp ref={ref} {...rest}>
      {children}
    </Comp>
  );
}
