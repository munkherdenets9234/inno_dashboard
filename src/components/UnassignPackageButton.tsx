"use client";

import { unassignPackageAction } from "@/app/(dashboard)/tenants/actions";

export default function UnassignPackageButton({ tenantId, packageId }: { tenantId: string; packageId: string }) {
  const boundUnassign = unassignPackageAction.bind(null, tenantId, packageId);

  return (
    <form action={boundUnassign}>
      <button type="submit" className="label text-paper/35 hover:text-accent transition-colors">
        Unassign
      </button>
    </form>
  );
}
