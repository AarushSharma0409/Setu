import type { Metadata } from "next";

import { InquiryDetail } from "../../../../components/inquiry-detail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vendor inquiry | Setu",
  robots: { index: false, follow: false },
};

export default async function VendorInquiryDetailPage({
  params,
}: {
  params: Promise<{ inquiryId: string }>;
}) {
  return <InquiryDetail mode="vendor" id={(await params).inquiryId} />;
}
