import { Card, PageContainer } from "@setu/ui";

import { ProtectedShell } from "../../components/protected-shell";

export default function DashboardPage() {
  return (
    <PageContainer>
      <ProtectedShell>
        <Card>
          <h1 className="text-2xl font-semibold">Operations dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sprint 1 exposes only authentication and system status foundations.
            Vendor queues and marketplace operations are intentionally absent.
          </p>
        </Card>
      </ProtectedShell>
    </PageContainer>
  );
}
