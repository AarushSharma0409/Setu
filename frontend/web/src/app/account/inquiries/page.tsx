import type { Metadata } from "next";

import { InquiryList } from "../../../components/inquiry-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My inquiries | Setu",
  robots: { index: false, follow: false },
};

export default function AccountInquiriesPage() {
  return <InquiryList mode="user" />;
}
