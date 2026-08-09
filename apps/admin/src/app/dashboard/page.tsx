import { Card, PageContainer, PageHeader, StatusBadge } from "@setu/ui";
import Link from "next/link";

import { ProtectedShell } from "../../components/protected-shell";

const overviewMetrics = [
  {
    label: "Verification queue",
    value: "Ready",
    detail: "Review incoming vendor applications.",
    href: "/dashboard/vendors",
    status: "PENDING_REVIEW",
  },
  {
    label: "Platform health",
    value: "Monitored",
    detail: "PostgreSQL, Redis, and API readiness.",
    href: "/dashboard/system-status",
    status: "ACTIVE",
  },
  {
    label: "Audit boundary",
    value: "Protected",
    detail: "Append-only operational history.",
    href: "/dashboard/audit",
    status: "ACTIVE",
  },
] as const;

export default function DashboardPage() {
  return (
    <PageContainer>
      <ProtectedShell>
        <PageHeader
          actions={
            <Link className="setu-button setu-button-primary setu-button-sm" href="/dashboard/vendors">
              Open verification queue
            </Link>
          }
          eyebrow="Setu operations"
          title="A clear view of operations."
          description="Review service-provider applications, confirm platform readiness, and keep every administrative decision traceable."
        />

        <section className="setu-admin-dashboard-metrics" aria-label="Operations overview">
          {overviewMetrics.map((metric, index) => (
            <Link href={metric.href} key={metric.label}>
              <Card className="setu-admin-dashboard-metric h-full">
                <div className="setu-admin-dashboard-metric-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <StatusBadge status={metric.status} />
                </div>
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <small>{metric.detail}</small>
                <em>Open workspace ↗</em>
              </Card>
            </Link>
          ))}
        </section>

        <section className="setu-admin-dashboard-panels">
          <Card className="setu-admin-dashboard-focus">
            <p className="setu-admin-dashboard-kicker">Start here</p>
            <h2>Move through the operational rhythm.</h2>
            <p>
              Each workspace is designed around a clear next step, with status
              changes and sensitive actions retained in the audit trail.
            </p>
            <div className="setu-admin-dashboard-steps">
              {[
                ["01", "Review", "Inspect submitted vendor applications."],
                ["02", "Decide", "Record an approval, rejection, or hold."],
                ["03", "Verify", "Confirm the outcome in the audit history."],
              ].map(([index, title, detail]) => (
                <div key={index}>
                  <span>{index}</span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </div>
              ))}
            </div>
          </Card>
          <Card className="setu-admin-dashboard-guardrails">
            <p className="setu-admin-dashboard-kicker">Workspace guardrails</p>
            <h2>Designed for deliberate decisions.</h2>
            <ul>
              <li>Authentication is separate from public-user access.</li>
              <li>Administrative actions are retained in append-only history.</li>
              <li>Insurance administration stays private and configuration-led.</li>
            </ul>
            <Link href="/insurance" className="setu-admin-dashboard-text-link">
              Review insurance administration <span aria-hidden="true">→</span>
            </Link>
          </Card>
        </section>
      </ProtectedShell>
    </PageContainer>
  );
}
