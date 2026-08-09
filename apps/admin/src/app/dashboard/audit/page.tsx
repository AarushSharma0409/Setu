"use client";

import {
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@setu/ui";
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
  const entries = query.data?.items ?? [];
  const distinctActions = new Set(entries.map((entry) => display(entry.action)));
  const distinctAdmins = new Set(
    entries.map((entry) =>
      display(
        (entry.adminUser as { email?: unknown } | undefined)?.email ??
          entry.adminUserId,
      ),
    ),
  );

  return (
    <PageContainer>
      <ProtectedShell>
        <PageHeader
          eyebrow="Operational record"
          title="Audit history, kept clear."
          description="An append-only record of administrative security activity and decisions made across Setu operations."
        />
        {query.isLoading ? <LoadingState label="Loading audit log" /> : null}
        {query.isError ? (
          <ErrorState
            title="Audit log unavailable"
            detail="You may not have permission to view these records."
          />
        ) : null}
        {query.data && entries.length === 0 ? (
          <Card className="setu-admin-audit-empty">
            <p className="setu-admin-dashboard-kicker">No activity recorded</p>
            <h2>The audit trail is ready.</h2>
            <p>No administrative events match the current record set.</p>
          </Card>
        ) : null}
        {query.data && entries.length > 0 ? (
          <>
            <section className="setu-admin-audit-summary" aria-label="Audit summary">
              {[
                ["Recorded events", String(entries.length), "Current result set"],
                ["Action types", String(distinctActions.size), "Tracked operations"],
                ["Administrators", String(distinctAdmins.size), "Identities represented"],
              ].map(([label, value, detail], index) => (
                <Card className="setu-admin-audit-summary-card" key={label}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{label}</p>
                  <strong>{value}</strong>
                  <small>{detail}</small>
                </Card>
              ))}
            </section>
            <Card className="setu-admin-audit-table overflow-x-auto p-0">
              <div className="setu-admin-audit-table-title">
                <div>
                  <p className="setu-admin-dashboard-kicker">Chronological record</p>
                  <h2>Recent administrative activity</h2>
                </div>
                <span>Append-only</span>
              </div>
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
                {entries.map((entry) => (
                  <tr
                    className="border-b border-slate-100"
                    key={display(entry.id)}
                  >
                    <td className="px-4 py-3">
                      <time dateTime={display(entry.createdAt)}>
                        {formatDate(entry.createdAt)}
                      </time>
                    </td>
                    <td className="px-4 py-3">
                      <span className="setu-admin-audit-action">
                        {display(entry.action).replaceAll("_", " ")}
                      </span>
                    </td>
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
          </>
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

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleString(undefined, {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        year: "numeric",
      });
}
