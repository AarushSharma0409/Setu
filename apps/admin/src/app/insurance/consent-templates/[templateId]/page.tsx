import { InsurancePage } from "../../../../components/insurance-page";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function InsuranceConsentTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return <InsurancePage view="consent-template-detail" id={templateId} />;
}
