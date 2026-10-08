// Shown in place of a page that needs digitalservice while digitalservice is
// not configured.
//
// It is a notice, not an error: the platform is deliberately running on
// tenantcore alone for now, and a page that says "API error (0)" about a
// service nobody has wired up sends whoever reads it looking for a fault that
// does not exist.
export default function ContentServiceNotice({ what }: { what: string }) {
  return (
    <div className="flex flex-col gap-3 border border-paper/15 px-5 py-6 max-w-xl">
      <h2 className="font-heading text-lg">Not available yet</h2>
      <p className="text-sm text-paper/70">
        {what} lives in digitalservice, which this console is not connected to. Tenants, plans and
        subscriptions are unaffected — they come from tenantcore.
      </p>
      <p className="label text-paper/35">
        Set API_URL in .env.local and sign in again to turn this section on.
      </p>
    </div>
  );
}
