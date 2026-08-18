"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass } from "@/components/AdminField";
import MultiLangField from "@/components/MultiLangField";
import ImageUploadField from "@/components/ImageUploadField";
import GalleryUploadField from "@/components/GalleryUploadField";
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

      <AdminField label="Website URL" htmlFor="website_url" hint="the project's own live site — shown as live_url">
        <input
          id="website_url"
          name="website_url"
          type="url"
          defaultValue={project?.website_url}
          className={fieldInputClass}
        />
      </AdminField>

      <div className="grid grid-cols-2 gap-4 items-start">
        <ImageUploadField name="cover_image_url" label="Cover image" defaultValue={project?.cover_image?.url} />
        <AdminField label="Cover image caption" htmlFor="cover_image_caption">
          <input
            id="cover_image_caption"
            name="cover_image_caption"
            defaultValue={project?.cover_image?.caption}
            className={fieldInputClass}
          />
        </AdminField>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <ImageUploadField
          name="admin_cover_url"
          label="Admin cover (front-page/list image)"
          defaultValue={project?.admin_cover?.url}
        />
        <AdminField label="Admin cover caption" htmlFor="admin_cover_caption">
          <input
            id="admin_cover_caption"
            name="admin_cover_caption"
            defaultValue={project?.admin_cover?.caption}
            className={fieldInputClass}
          />
        </AdminField>
      </div>

      <GalleryUploadField name="images" label="Gallery images" defaultValue={project?.images} />
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
