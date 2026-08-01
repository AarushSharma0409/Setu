"use client";

import { Card, ErrorState, LoadingState, PageContainer } from "@setu/ui";
import { useQuery } from "@tanstack/react-query";

import { ProtectedShell } from "../../../components/protected-shell";
import { adminApi } from "../../../lib/admin-api-client";

export default function AdminAuditPage() {
  const token =
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem("setu_admin_access_token");
  const query = useQuery({
    enabled: Boolean(token),
    queryKey: ["admin-audit-logs"],
    queryFn: () => adminApi.auditLogs(token ?? ""),
  });

  return (
    <PageContainer>
      <ProtectedShell>
        <Card>
          <h1 className="text-2xl font-semibold">Audit log</h1>
          <p className="mt-2 text-sm text-slate-600">
            Append-only administrative security and vendor decision history.
          </p>
        </Card>
        {query.isLoading ? <LoadingState label="Loading audit log" /> : null}
        {query.isError ? (
          <ErrorState
            title="Audit log unavailable"
            detail="You may not have permission to view these records."
          />
        ) : null}
        {query.data && query.data.items.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-600">No audit events found.</p>
          </Card>
        ) : null}
        {query.data && query.data.items.length > 0 ? (
          <Card className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Admin</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((entry) => (
                  <tr
                    className="border-b border-slate-100"
                    key={display(entry.id)}
                  >
                    <td className="px-4 py-3">{display(entry.createdAt)}</td>
                    <td className="px-4 py-3">{display(entry.action)}</td>
                    <td className="px-4 py-3">
                      {display(entry.entityType)} {display(entry.entityId)}
                    </td>
                    <td className="px-4 py-3">
                      {display(
                        (entry.adminUser as { email?: unknown } | undefined)
                          ?.email ?? entry.adminUserId,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : null}
      </ProtectedShell>
    </PageContainer>
  );
}

function display(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  return "";
}
