import { safeLoad } from "@/lib/api/safe";
import { getPaymentSettings } from "@/lib/data/payment-settings";
import PaymentSettingsForm from "@/components/PaymentSettingsForm";
import { savePaymentSettingsAction } from "./actions";

export default async function PaymentSettingsPage() {
  const result = await safeLoad(() => getPaymentSettings());

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl">Payment settings</h1>
        <p className="label text-paper/35 mt-1">
          Our bank account, printed on every invoice we email. Invoices cannot be sent until it is set. An invoice keeps
          the details it was first sent with, so later edits only apply to invoices sent from now on.
        </p>
      </div>
      {result.ok ? (
        <PaymentSettingsForm settings={result.data} action={savePaymentSettingsAction} />
      ) : (
        <p className="label text-accent">{result.message}</p>
      )}
    </div>
  );
}
