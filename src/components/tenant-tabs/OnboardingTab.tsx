import { safeLoad } from "@/lib/api/safe";
import { getOnboardingStatus } from "@/lib/data/onboarding";
import OnboardingPanel from "@/components/OnboardingPanel";
import { previewOnboardingAction, sendOnboardingAction } from "@/app/admin/(console)/tenants/actions";

export default async function OnboardingTab({ id }: { id: string }) {
  const res = await safeLoad(() => getOnboardingStatus(id));
  return res.ok ? (
    <OnboardingPanel
      status={res.data}
      preview={previewOnboardingAction.bind(null, id)}
      send={sendOnboardingAction.bind(null, id)}
    />
  ) : (
    <p className="label text-accent">{res.message}</p>
  );
}
