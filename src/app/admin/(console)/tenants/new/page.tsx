import NewTenantForm from "@/components/NewTenantForm";
import { createTenantAction } from "../actions";

// Creating a tenant is a tenantcore act now. digitalservice learns about the
// tenant when someone first edits its showcase content, keyed by the id
// assigned here — there is nothing to create on that side up front.
export default function NewTenantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">New tenant</h1>
        <p className="label text-paper/35 mt-1">
          Provisions the platform record and its API key. Subscribe it to a plan afterwards.
        </p>
      </div>
      <NewTenantForm action={createTenantAction} />
    </div>
  );
}
