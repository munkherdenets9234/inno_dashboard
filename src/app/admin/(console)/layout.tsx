import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AdminShell from "@/components/AdminShell";

// The gate for the whole console.
//
// It sits on this route group rather than on /admin, because /admin/login
// must stay reachable while signed out — a gate above it would be a
// redirect loop. Every page that needs a session is inside this group; the
// only thing under /admin that is not is the login screen.
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // data-console pins this subtree to the dark palette. The public site now
  // shares this app's stylesheet and can flip to a light theme on
  // html[data-theme="light"]; the console was designed dark-only and has
  // never been looked at light, so a visitor's theme choice must not follow
  // an operator in here.
  return (
    <div data-console className="contents">
      <AdminShell email={session.email}>{children}</AdminShell>
    </div>
  );
}
