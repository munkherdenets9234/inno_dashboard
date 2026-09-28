import { ThemeProvider } from "@/components/site/theme/ThemeProvider";
import { LanguageProvider } from "@/components/site/i18n/LanguageProvider";
import { ContentProvider } from "@/components/site/i18n/ContentProvider";
import { fetchOverrides } from "@/lib/content";

// The public marketing site.
//
// Its providers live here rather than at the root so the console does not
// pay for them, and — more to the point — so the console cannot be affected
// by them. The language toggle and light/dark theme belong to visitors;
// an operator editing a plan should not be able to put the console into
// Mongolian by having clicked a toggle on the home page earlier.
//
// Async so the editable copy is fetched once per render and handed to the
// whole tree. fetchOverrides degrades to the built-in dictionaries on any
// failure, so this await cannot take the site down.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const overrides = await fetchOverrides();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ContentProvider overrides={overrides}>{children}</ContentProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
