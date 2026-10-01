import LoginForm from "./LoginForm";

// A server component so it can read ?reset=1 from the URL. The form itself is a
// client component (it uses useActionState), and reading search params there
// would need a Suspense boundary just to show one line of text.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  return <LoginForm notice={reset === "1" ? "Password changed. Sign in with the new one." : undefined} />;
}
