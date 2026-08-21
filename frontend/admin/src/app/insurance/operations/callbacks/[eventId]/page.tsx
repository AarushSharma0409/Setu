import { InsuranceOperationsDetailPage } from "../../../../../components/insurance-operations-detail-page";

export default async function InsuranceCallbackOperationsDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <InsuranceOperationsDetailPage resource="callbacks" id={eventId} />;
}
