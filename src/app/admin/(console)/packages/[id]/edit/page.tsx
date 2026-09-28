import { notFound } from "next/navigation";
import { getPackageById } from "@/lib/data/packages";
import { updatePackageAction } from "../../actions";
import PackageForm from "@/components/PackageForm";
import { ApiError } from "@/lib/api/client";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let pkg;
  try {
    pkg = (await getPackageById(id)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl">{pkg.name.en || pkg.slug}</h1>
      <PackageForm pkg={pkg} action={updatePackageAction.bind(null, pkg.id)} submitLabel="Save changes" />
    </div>
  );
}
