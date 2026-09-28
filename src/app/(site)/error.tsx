"use client";

import { useEffect } from "react";
import NavBar from "@/components/site/NavBar";
import SiteFooter from "@/components/site/SiteFooter";
import { ActionButton } from "@/components/site/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-24 text-center">
        <span className="label text-accent">Error</span>
        <h1 className="text-[13vw] leading-none tracking-tight sm:text-[52px]">Something broke.</h1>
        <p className="text-[15px] text-paper/70 max-w-md">
          That's on us, not you. Try again, or come back in a moment.
        </p>
        <ActionButton onClick={reset} className="mt-2">
          Try again
        </ActionButton>
      </main>
      <SiteFooter />
    </>
  );
}
