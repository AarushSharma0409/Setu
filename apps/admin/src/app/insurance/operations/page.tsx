"use client";

import {
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { ProtectedShell } from "../../../components/protected-shell";
import { adminApi } from "../../../lib/admin-api-client";

const windows = [1, 24, 168, 720] as const;

export default function InsuranceOperationsPage() {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_admin_access_token") ?? "");
  const [hours, setHours] = useState(24);
  const summary = useQuery({
    queryKey: ["insurance-operations", hours],
    queryFn: () =>
      adminApi.insuranceOperationsSummary(
        token,
        `from=${encodeURIComponent(new Date(Date.now() - hours * 3_600_000).toISOString())}`,
      ),
    enabled: Boolean(token),
  });
  if (!token)
    return (
      <PageContainer>
        <ProtectedShell>
          <ErrorState
            title="Sign in required"
            detail="Your MFA-backed admin session is required."
          />
        </ProtectedShell>
      </PageContainer>
    );
  if (summary.isLoading)
    return (
      <PageContainer>
        <ProtectedShell>
          <LoadingState label="Loading insurance operations" />
        </ProtectedShell>
      </PageContainer>
    );
  if (summary.error)
    return (
      <PageContainer>
        <ProtectedShell>
          <ErrorState
            title="Operations unavailable"
            detail="Enable operations and check your permission."
          />
        </ProtectedShell>
      </PageContainer>
    );
  const data = summary.data;
  return (
    <PageContainer>
      <ProtectedShell>
        <section className="space-y-6">
          <PageHeader
            eyebrow="Insurance operations"
            title="Operations dashboard"
            description="Real-time bounded metrics, configuration warnings, and controlled remediation."
          />
          <div className="setu-insurance-operations-window" aria-label="Reporting window">
            <span>Reporting window</span>
        {windows.map((value) => (
          <button
            className={
              hours === value
                ? "setu-button setu-button-primary setu-button-sm"
                : "setu-button setu-button-outline setu-button-sm"
            }
            key={value}
            onClick={() => setHours(value)}
            type="button"
          >
            Last{" "}
            {value === 1
              ? "hour"
              : `${value / 24 >= 1 ? value / 24 + " days" : value + " hours"}`}
          </button>
        ))}
          </div>
          <div className="setu-insurance-operations-metrics">
        {[
          ["Quote requests", data?.quoteRequests],
          ["Failed quotes", data?.failedQuotes],
          ["Active providers", data?.activeProviders],
          ["Handoffs", data?.handoffsCreated],
          ["Callbacks pending", data?.callbacksPending],
          ["Callbacks failed", data?.callbacksFailed],
          ["Providers degraded", data?.degradedProviders],
          ["Providers unavailable", data?.unavailableProviders],
        ].map(([label, value], index) => (
          <Card className="setu-insurance-operations-metric" key={String(label)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{label}</p>
            <strong>{String(value ?? 0)}</strong>
          </Card>
        ))}
          </div>
          <Card className="setu-insurance-operations-warnings">
        <div>
          <p className="setu-admin-dashboard-kicker">Attention required</p>
          <h2>Configuration warnings</h2>
        </div>
        {data?.warnings.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {data.warnings.map((warning) => (
              <li key={warning.code}>
                {warning.severity}: {warning.code.replaceAll("_", " ")} (
                {warning.count})
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            No current configuration warnings.
          </p>
        )}
          </Card>
          <nav className="setu-insurance-operations-links">
        {[
          ["/insurance/operations/quotes", "Quote operations", "Inspect quote lifecycle events."],
          ["/insurance/operations/providers", "Provider operations", "Review health and provider context."],
          ["/insurance/operations/callbacks", "Callback operations", "Track safe callback processing state."],
          ["/insurance/operations/handoffs", "Handoff operations", "Review external continuation history."],
          ["/insurance/integrations", "Provider integrations", "Check controlled connection health."],
          ["/insurance/support", "Customer support", "Search exact protected references."],
        ].map(([href, label, detail], index) => (
          <Link
            className="setu-insurance-operations-link"
            href={href}
            key={href}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{label}</strong>
            <small>{detail}</small>
            <em>Open ↗</em>
          </Link>
        ))}
          </nav>
        </section>
      </ProtectedShell>
    </PageContainer>
  );
}
