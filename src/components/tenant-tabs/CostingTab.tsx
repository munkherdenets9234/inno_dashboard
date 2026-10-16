import { safeLoad } from "@/lib/api/safe";
import { listTenantDomains } from "@/lib/data/domains";
import { getTenantCosting, listTenantInvoices } from "@/lib/data/costing";
import { getPaymentSettings } from "@/lib/data/payment-settings";
import CostingPanel from "@/components/CostingPanel";
import {
  createInvoiceAction,
  deleteFeeAction,
  deleteInvoiceAction,
  editInvoiceAction,
  invoiceStepAction,
  markInvoicePaidAction,
  previewInvoiceAction,
  registrarPaidAction,
  saveFeeAction,
} from "@/app/admin/(console)/tenants/actions";

export default async function CostingTab({ id }: { id: string }) {
  const [costingRes, invoicesRes, domainsRes, settingsRes] = await Promise.all([
    safeLoad(() => getTenantCosting(id)),
    safeLoad(() => listTenantInvoices(id)),
    safeLoad(() => listTenantDomains(id)),
    safeLoad(() => getPaymentSettings()),
  ]);

  const failure = [costingRes, invoicesRes, domainsRes, settingsRes].find((r) => !r.ok);

  return failure && !failure.ok ? (
    <p className="label text-accent">{failure.message}</p>
  ) : costingRes.ok && invoicesRes.ok && domainsRes.ok && settingsRes.ok ? (
    <CostingPanel
      costing={costingRes.data}
      invoices={invoicesRes.data}
      domains={domainsRes.data}
      // Sending is blocked (here and by the server) until our bank details are set.
      paymentConfigured={settingsRes.data.configured}
      // Computed once on the server and passed down, so the due-soon and
      // overdue badges agree between the server render and the browser.
      nowIso={new Date().toISOString()}
      saveFee={saveFeeAction.bind(null, id)}
      deleteFee={deleteFeeAction.bind(null, id)}
      createInvoice={createInvoiceAction.bind(null, id)}
      invoiceStep={invoiceStepAction.bind(null, id)}
      editInvoice={editInvoiceAction.bind(null, id)}
      deleteInvoice={deleteInvoiceAction.bind(null, id)}
      markPaid={markInvoicePaidAction.bind(null, id)}
      previewInvoice={previewInvoiceAction.bind(null, id)}
      markRegistrarPaid={registrarPaidAction.bind(null, id)}
    />
  ) : null;
}
