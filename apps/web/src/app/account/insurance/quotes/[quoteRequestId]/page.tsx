import { InsuranceQuoteDetail } from "../../../../../components/insurance-quote-detail";

export const dynamic = "force-dynamic";

export default async function InsuranceQuoteDetailPage({
  params,
}: {
  params: Promise<{ quoteRequestId: string }>;
}) {
  const { quoteRequestId } = await params;
  return <InsuranceQuoteDetail quoteRequestId={quoteRequestId} />;
}
