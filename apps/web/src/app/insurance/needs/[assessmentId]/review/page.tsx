import { InsuranceAssessmentReview } from "../../../../../components/insurance-assessment-review";

export const dynamic = "force-dynamic";

export default async function InsuranceAssessmentReviewPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <InsuranceAssessmentReview assessmentId={assessmentId} />;
}
