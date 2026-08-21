import type { Metadata } from "next";

import { InquiryList } from "../../../components/inquiry-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vendor inquiries | Setu",
  robots: { index: false, follow: false },
};

export default function VendorInquiriesPage() {
  return <InquiryList mode="vendor" />;
}
