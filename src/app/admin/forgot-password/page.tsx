import ForgotPasswordForm from "./ForgotPasswordForm";

// Deliberately outside the (console) group, like the login page: it has to be
// reachable by someone who cannot sign in, so it must not sit behind the
// console's session gate or it would redirect to login forever.
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
