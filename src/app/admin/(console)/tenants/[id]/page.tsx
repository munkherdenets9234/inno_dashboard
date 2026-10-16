import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getTenantById } from "@/lib/data/tenants";
import OverviewTab from "@/components/tenant-tabs/OverviewTab";
import SubscriptionTab from "@/components/tenant-tabs/SubscriptionTab";
import DomainsTab from "@/components/tenant-tabs/DomainsTab";
import CostingTab from "@/components/tenant-tabs/CostingTab";
import PackagesTab from "@/components/tenant-tabs/PackagesTab";
import LeadsTab from "@/components/tenant-tabs/LeadsTab";
import ProjectTab from "@/components/tenant-tabs/ProjectTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "subscription", label: "Subscription" },
  { key: "domains", label: "Domains" },
  { key: "costing", label: "Costing" },
  { key: "packages", label: "Packages" },
  { key: "leads", label: "Leads" },
  { key: "project", label: "Project" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function parseTab(raw: string | string[] | undefined): TabKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return TABS.find((t) => t.key === v)?.key ?? "overview";
}

export default async function TenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[]; page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = parseTab(sp.tab);

  let tenant;
  try {
    tenant = (await getTenantById(id)).data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl">{tenant.name}</h1>
        <p className="label text-paper/35 mt-1">
          {tenant.slug} ·{" "}
          <span className={tenant.status === "active" ? "text-paper" : "text-paper/35"}>{tenant.status}</span> ·{" "}
          {tenant.contact_email || "no contact email"}
        </p>
      </div>

      <nav aria-label="Tenant sections" className="flex gap-1 overflow-x-auto border-b border-paper/10">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/admin/tenants/${id}?tab=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={`label shrink-0 whitespace-nowrap px-4 py-3 -mb-px border-b-2 transition-colors ${
                active
                  ? "border-accent text-paper"
                  : "border-transparent text-paper/70 hover:text-accent"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {tab === "overview" && <OverviewTab id={id} tenant={tenant} />}
      {tab === "subscription" && <SubscriptionTab id={id} />}
      {tab === "domains" && <DomainsTab id={id} />}
      {tab === "costing" && <CostingTab id={id} />}
      {tab === "packages" && <PackagesTab id={id} />}
      {tab === "leads" && <LeadsTab id={id} searchParams={sp} />}
      {tab === "project" && <ProjectTab tenant={tenant} />}
    </div>
  );
}
