"use client";

import { Card, ErrorState, LoadingState, PageHeader } from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

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
      <ErrorState
        title="Sign in required"
        detail="Your MFA-backed admin session is required."
      />
    );
  if (summary.isLoading)
    return <LoadingState label="Loading insurance operations" />;
  if (summary.error)
    return (
      <ErrorState
        title="Operations unavailable"
        detail="Enable operations and check your permission."
      />
    );
  const data = summary.data;
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Insurance operations"
        title="Operations dashboard"
        description="Real-time bounded metrics, configuration warnings, and controlled remediation."
      />
      <div className="flex flex-wrap gap-2">
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Quote requests", data?.quoteRequests],
          ["Failed quotes", data?.failedQuotes],
          ["Active providers", data?.activeProviders],
          ["Handoffs", data?.handoffsCreated],
          ["Callbacks pending", data?.callbacksPending],
          ["Callbacks failed", data?.callbacksFailed],
          ["Providers degraded", data?.degradedProviders],
          ["Providers unavailable", data?.unavailableProviders],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{String(value ?? 0)}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold">Configuration warnings</h2>
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
      <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["/insurance/operations/quotes", "Quote operations"],
          ["/insurance/operations/providers", "Provider operations"],
          ["/insurance/operations/callbacks", "Callback operations"],
          ["/insurance/operations/handoffs", "Handoff operations"],
          ["/insurance/integrations", "Provider integrations"],
          ["/insurance/support", "Customer support"],
        ].map(([href, label]) => (
          <Link
            className="rounded-lg border bg-white p-4 font-medium hover:border-violet-300"
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
