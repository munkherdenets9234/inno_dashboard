export type QuoteLink = "linked" | "taken" | "failed";
export function normalizeQuoteLink(quoteLink: unknown, quoteLinked: unknown): QuoteLink;
export function promoteNotice(quoteLink: string | undefined, tenantName: string): string | null;
export function enterOnce(ref: { current: boolean }): boolean;
export function leave(ref: { current: boolean }): void;
