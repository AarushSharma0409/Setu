import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function InsuranceQuoteDetailPage() {
  redirect("/categories/finance");
}
