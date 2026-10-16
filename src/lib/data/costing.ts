import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { Invoice, InvoicePreview, TenantCosting } from "@/lib/types";

// GET /admin/tenants/{id}/costing: fees with next due, the derived
// subscription line, derived domain lines, registrar payables and the total
// of the due lines.
export async function getTenantCosting(tenantId: string): Promise<TenantCosting> {
  const token = await requireToken();
  const res = await apiGet<TenantCosting>(`/admin/tenants/${tenantId}/costing`, undefined, token);
  return res.data;
}

// GET /admin/tenants/{id}/invoices/{invId}/preview: the invoice mail rendered
// with the same renderer Send uses. Nothing is sent and nothing changes.
export async function getInvoicePreview(tenantId: string, invoiceId: string): Promise<InvoicePreview> {
  const token = await requireToken();
  const res = await apiGet<InvoicePreview>(`/admin/tenants/${tenantId}/invoices/${invoiceId}/preview`, undefined, token);
  return res.data;
}

// GET /admin/tenants/{id}/invoices, newest first.
export async function listTenantInvoices(tenantId: string): Promise<Invoice[]> {
  const token = await requireToken();
  const res = await apiGet<Invoice[] | null>(`/admin/tenants/${tenantId}/invoices`, undefined, token);
  return res.data ?? [];
}
