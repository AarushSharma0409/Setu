import {
  Card,
  PageContainer,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@setu/ui";

import { ProtectedShell } from "../../components/protected-shell";

export default function DashboardPage() {
  return (
    <PageContainer>
      <ProtectedShell>
        <PageHeader
          eyebrow="Setu operations"
          title="Operations dashboard"
          description="A focused workspace for vendor verification, system health, and audit review."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">Verification</p>
            <p className="mt-2 text-2xl font-bold">Queue</p>
            <StatusBadge status="PENDING_REVIEW" />
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Access</p>
            <p className="mt-2 text-2xl font-bold">Protected</p>
            <StatusBadge status="ACTIVE" />
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Audit trail</p>
            <p className="mt-2 text-2xl font-bold">Append-only</p>
            <StatusBadge status="ACTIVE" />
          </Card>
        </div>
        <Card>
          <SectionHeader
            title="Start with a review queue"
            description="Use the navigation to inspect vendor applications and make status decisions with an audit trail."
          />
        </Card>
      </ProtectedShell>
    </PageContainer>
  );
}
