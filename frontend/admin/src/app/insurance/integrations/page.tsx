"use client";

import { Button, Card, ErrorState, LoadingState, PageHeader } from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AdminPageFrame } from "../../../components/admin-page-frame";
import { adminApi } from "../../../lib/admin-api-client";

export default function InsuranceIntegrationsPage() {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_admin_access_token") ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const dashboard = useQuery({
    queryKey: ["insurance-integration-dashboard"],
    queryFn: () => adminApi.insuranceIntegrationDashboard(token),
    enabled: Boolean(token),
  });
  const integrations = useQuery({
    queryKey: ["insurance-integrations"],
    queryFn: () => adminApi.insuranceIntegrations(token),
    enabled: Boolean(token),
  });
  async function test(id: string) {
    try {
      const result = await adminApi.testInsuranceIntegration(token, id);
      setMessage(`Connection check: ${result.status} — ${result.summary}`);
    } catch {
      setMessage("Connection check could not be completed.");
    }
  }
  if (!token)
    return (
      <AdminPageFrame>
        <ErrorState
          title="Sign in required"
          detail="Your admin session is required."
        />
      </AdminPageFrame>
    );
  if (dashboard.isLoading || integrations.isLoading)
    return (
      <AdminPageFrame>
        <LoadingState label="Loading integration operations" />
      </AdminPageFrame>
    );
  if (dashboard.error || integrations.error)
    return (
      <AdminPageFrame>
        <ErrorState
          title="Integration operations unavailable"
          detail="Enable the insurance integration controls and confirm your permission."
        />
      </AdminPageFrame>
    );
  const metrics = dashboard.data;
  return (
    <AdminPageFrame>
      <section className="space-y-6">
      <PageHeader
        eyebrow="Insurance operations"
        title="Provider integrations"
        description="Configuration and health only. Credentials are managed by secure references and never displayed here."
      />
      <div className="setu-insurance-operations-metrics">
        {[
          ["Active", metrics?.active],
          ["Sandbox", metrics?.sandbox],
          ["Healthy", metrics?.healthy],
          ["Handoffs (24h)", metrics?.handoffsCreatedLast24Hours],
        ].map(([label, value], index) => (
          <Card className="setu-insurance-operations-metric" key={String(label)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{label}</p>
            <strong>{String(value ?? 0)}</strong>
          </Card>
        ))}
      </div>
      {message ? (
        <p
          className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Provider</th>
                <th className="p-3">Environment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Health</th>
                <th className="p-3">Credentials</th>
                <th className="p-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {integrations.data?.items.map((item) => (
                <tr className="border-b" key={item.id}>
                  <td className="p-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-slate-500">{item.code}</p>
                  </td>
                  <td className="p-3">{item.environment}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3">{item.healthStatus}</td>
                  <td className="p-3">
                    {item.credentialConfigured
                      ? "Configured"
                      : "Not configured"}
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void test(item.id)}
                    >
                      Test connection
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {integrations.data?.items.length === 0 ? (
            <p className="p-4 text-sm text-slate-600">
              No provider integrations are configured.
            </p>
          ) : null}
        </div>
      </Card>
      </section>
    </AdminPageFrame>
  );
}
