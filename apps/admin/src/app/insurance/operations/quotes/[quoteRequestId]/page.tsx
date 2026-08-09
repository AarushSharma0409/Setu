import { InsuranceOperationsDetailPage } from "../../../../../components/insurance-operations-detail-page";

export default async function InsuranceQuoteOperationsDetailPage({
  params,
}: {
  params: Promise<{ quoteRequestId: string }>;
}) {
  const { quoteRequestId } = await params;
  return (
    <InsuranceOperationsDetailPage resource="quotes" id={quoteRequestId} />
  );
}
