"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className="label text-paper/55 hover:text-accent transition-colors w-9 h-9 flex items-center justify-center border border-paper/20 hover:border-accent"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" suppressHydrationWarning>
        {isLight ? (
          <path
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.41 1.41M6.05 17.95l-1.41 1.41m12.72 0-1.41-1.41M6.05 6.05 4.64 4.64M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
