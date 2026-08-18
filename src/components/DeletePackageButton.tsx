"use client";

import { deletePackageAction } from "@/app/(dashboard)/packages/actions";

export default function DeletePackageButton({ id }: { id: string }) {
  const boundDelete = deletePackageAction.bind(null, id);

  return (
    <form
      action={boundDelete}
      onSubmit={(e) => {
        if (!window.confirm("Delete this package? This can't be undone.")) e.preventDefault();
      }}
    >
      <button type="submit" className="label text-paper/35 hover:text-accent transition-colors">
        Delete
      </button>
    </form>
  );
}
