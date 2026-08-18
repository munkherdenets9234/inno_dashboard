import PackageForm from "@/components/PackageForm";
import { createPackageAction } from "../actions";

export default function NewPackagePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl">New package</h1>
      <PackageForm action={createPackageAction} submitLabel="Create package" />
    </div>
  );
}
