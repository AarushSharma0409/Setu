import { InsuranceOperationsDetailPage } from "../../../../../components/insurance-operations-detail-page";

export default async function InsuranceProviderOperationsDetailPage({
  params,
}: {
  params: Promise<{ integrationId: string }>;
}) {
  const { integrationId } = await params;
  return (
    <InsuranceOperationsDetailPage resource="providers" id={integrationId} />
  );
}
