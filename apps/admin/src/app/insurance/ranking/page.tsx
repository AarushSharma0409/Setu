import { Card } from "@setu/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function InsuranceRankingPage() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Ranking methodologies</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ranking is disabled until an approved, versioned methodology and
        operating-model capability are configured. Commercial arrangements never
        influence ordering.
      </p>
    </Card>
  );
}
