import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import { getPlanById } from "@/lib/data/plans";
import PlanForm from "@/components/PlanForm";
import { updatePlanAction } from "../../actions";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await requireToken();

  let plan;
  try {
    plan = (await getPlanById(id, token)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">{plan.name}</h1>
        <p className="label text-paper/35 mt-1">
          {plan.slug} · edits take effect on every subscriber&apos;s next entitlement lookup
        </p>
      </div>
      <PlanForm plan={plan} submitLabel="Save plan" action={updatePlanAction.bind(null, id)} />
    </div>
  );
}
