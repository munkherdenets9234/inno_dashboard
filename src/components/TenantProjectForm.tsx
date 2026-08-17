"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass } from "@/components/AdminField";
import MultiLangField from "@/components/MultiLangField";
import ImagesField from "@/components/ImagesField";
import MetricsField from "@/components/MetricsField";
import type { TenantProjectFormState } from "@/app/(dashboard)/tenants/actions";
import type { Tenant } from "@/lib/types";

export default function TenantProjectForm({
  tenant,
  action,
}: {
  tenant: Tenant;
  action: (prevState: TenantProjectFormState, formData: FormData) => Promise<TenantProjectFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const project = tenant.project;

  return (
    <form action={formAction} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-6">
        <label className="label text-paper/55 flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="showcase" defaultChecked={project?.showcase} />
          Showcase (visible on the tenant&apos;s public site)
        </label>
        <label className="label text-paper/55 flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="featured" defaultChecked={project?.featured} />
          Featured
        </label>
      </div>

      <MultiLangField name="tagline" label="Tagline" defaultValue={project?.tagline} />
      <MultiLangField name="description" label="Description" multiline rows={4} defaultValue={project?.description} />

      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Category" htmlFor="category">
          <input id="category" name="category" defaultValue={project?.category} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Sort order" htmlFor="sort_order">
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={project?.sort_order ?? 0}
            className={fieldInputClass}
          />
        </AdminField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Cover image URL" htmlFor="cover_image_url">
          <input
            id="cover_image_url"
            name="cover_image_url"
            defaultValue={project?.cover_image?.url}
            className={fieldInputClass}
          />
        </AdminField>
        <AdminField label="Cover image caption" htmlFor="cover_image_caption">
          <input
            id="cover_image_caption"
            name="cover_image_caption"
            defaultValue={project?.cover_image?.caption}
            className={fieldInputClass}
          />
        </AdminField>
      </div>

      <ImagesField name="images" label="Gallery images" defaultValue={project?.images} />
      <MetricsField name="metrics" label="Metrics" defaultValue={project?.metrics} />

      {state.error && <p className="label text-accent">{state.error}</p>}

      <div className="flex items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </ActionButton>
        {state.saved && <span className="label text-paper/35">Saved.</span>}
      </div>
    </form>
  );
}
