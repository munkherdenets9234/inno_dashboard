import { redirect } from "next/navigation";

// /admin on its own is not a page. Tenants is where an operator starts.
export default function AdminIndex() {
  redirect("/admin/tenants");
}
