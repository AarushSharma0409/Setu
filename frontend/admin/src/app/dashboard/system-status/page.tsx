"use client";

import { Card, ErrorState, LoadingState, PageContainer } from "@setu/ui";
import { useQuery } from "@tanstack/react-query";

import { ProtectedShell } from "../../../components/protected-shell";
import { adminApi } from "../../../lib/admin-api-client";

export default function SystemStatusPage() {
  const accessToken =
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem("setu_admin_access_token");
  const query = useQuery({
    enabled: Boolean(accessToken),
    queryKey: ["admin-system-status"],
    queryFn: () => adminApi.systemStatus(accessToken ?? ""),
  });

  return (
    <PageContainer>
      <ProtectedShell>
        {query.isLoading ? (
          <LoadingState label="Checking system status" />
        ) : null}
        {query.isError ? (
          <ErrorState
            title="System status unavailable"
            detail="The API may be offline or the session may have expired."
          />
        ) : null}
        {query.data ? (
          <Card>
            <h1 className="text-2xl font-semibold">System status</h1>
            <p className="mt-3 text-sm text-slate-600">
              Application: {query.data.application}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Checked: {query.data.checkedAt}
            </p>
            <p className="mt-4 text-lg font-medium text-emerald-700">
              {query.data.health.status}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              PostgreSQL: {query.data.health.dependencies.postgres}. Redis:{" "}
              {query.data.health.dependencies.redis}.
            </p>
          </Card>
        ) : null}
      </ProtectedShell>
    </PageContainer>
  );
}
