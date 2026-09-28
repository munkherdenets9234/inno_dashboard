import Link from "next/link";
import NavBar from "@/components/site/NavBar";
import SiteFooter from "@/components/site/SiteFooter";
import { LinkButton } from "@/components/site/Button";

export default function NotFound() {
  return (
    <>
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-24 text-center">
        <span className="label text-accent">404</span>
        <h1 className="text-[13vw] leading-none tracking-tight sm:text-[64px]">Page not found.</h1>
        <p className="text-[15px] text-paper/70 max-w-md">
          Whatever you were looking for isn&apos;t here. Try the homepage, or{" "}
          <Link href="/contact" className="text-accent hover:underline">
            get in touch
          </Link>{" "}
          if you followed a broken link.
        </p>
        <LinkButton href="/" className="mt-2">
          Back to home
        </LinkButton>
      </main>
      <SiteFooter />
    </>
  );
}
