import { InsurancePage } from "../../../../components/insurance-page";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function InsuranceDisclosureDetailPage({
  params,
}: {
  params: Promise<{ disclosureId: string }>;
}) {
  const { disclosureId } = await params;
  return <InsurancePage view="disclosure-detail" id={disclosureId} />;
}
