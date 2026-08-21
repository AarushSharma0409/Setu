import { InsuranceOperationsDetailPage } from "../../../../../components/insurance-operations-detail-page";

export default async function InsuranceHandoffOperationsDetailPage({
  params,
}: {
  params: Promise<{ handoffId: string }>;
}) {
  const { handoffId } = await params;
  return <InsuranceOperationsDetailPage resource="handoffs" id={handoffId} />;
}
