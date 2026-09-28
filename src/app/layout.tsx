import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// One app, two faces: the public site under app/(site) and the operator's
// console under app/admin. This root does only what genuinely belongs to
// both — the document, the font, and the theme that must be set before
// first paint. Everything else (providers, chrome, the auth gate) belongs
// to whichever group needs it, which is what keeps a change to the console
// from being able to affect the marketing site.

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inno Nomads — Web development, hosting & support",
  description:
    "Inno Nomads is a web development studio in Ulaanbaatar. We design and build the full stack — UI/UX, frontend, backend and admin — then host it and support it.",
};

// Runs before paint so the page never flashes the wrong theme. It has to be
// inline and blocking; a React effect reads localStorage a frame too late.
const THEME_INIT_SCRIPT = `
try {
  var stored = localStorage.getItem('inno-theme');
  var theme = stored === 'light' || stored === 'dark'
    ? stored
    : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', theme);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-ink text-paper antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
