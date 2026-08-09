import { InsuranceAssessmentWizard } from "../../../../components/insurance-assessment-wizard";

export const dynamic = "force-dynamic";

export default async function InsuranceNeedsAssessmentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <InsuranceAssessmentWizard assessmentId={assessmentId} />;
}
