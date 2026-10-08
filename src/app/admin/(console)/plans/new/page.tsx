import PlanForm from "@/components/PlanForm";
import { createPlanAction } from "../actions";

export default function NewPlanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">New plan</h1>
        <p className="label text-paper/35 mt-1">
          A billing tier and the entitlement it grants. Tenants are subscribed to it from their own page.
        </p>
      </div>
      <PlanForm submitLabel="Create plan" action={createPlanAction} />
    </div>
  );
}
