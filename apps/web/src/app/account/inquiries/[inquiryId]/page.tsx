import type { Metadata } from "next";

import { InquiryDetail } from "../../../../components/inquiry-detail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Inquiry | Setu",
  robots: { index: false, follow: false },
};

export default async function AccountInquiryDetailPage({
  params,
}: {
  params: Promise<{ inquiryId: string }>;
}) {
  return <InquiryDetail mode="user" id={(await params).inquiryId} />;
}
