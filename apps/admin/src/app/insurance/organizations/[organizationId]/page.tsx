import { InsurancePage } from "../../../../components/insurance-page";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function InsuranceOrganizationDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return <InsurancePage view="organization-detail" id={organizationId} />;
}
