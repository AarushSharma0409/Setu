"use client";

import {
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ProtectedShell } from "../../../components/protected-shell";
import { adminApi } from "../../../lib/admin-api-client";

export default function AdminAuditPage() {
  const token =
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem("setu_admin_access_token");
  const [filters, setFilters] = useState({ action: "", entityType: "", from: "", to: "" });
  const filterQuery = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
  const query = useQuery({
    enabled: Boolean(token),
    queryKey: ["admin-audit-logs", filterQuery],
    queryFn: () => adminApi.auditLogs(token ?? "", filterQuery),
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
        <Card className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-medium">Action<input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} placeholder="e.g. VENDOR_APPROVED" value={filters.action} /></label>
            <label className="text-sm font-medium">Entity<input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" onChange={(event) => setFilters((current) => ({ ...current, entityType: event.target.value }))} placeholder="e.g. VendorProfile" value={filters.entityType} /></label>
            <label className="text-sm font-medium">From<input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} type="date" value={filters.from} /></label>
            <label className="text-sm font-medium">To<input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} type="date" value={filters.to} /></label>
          </div>
          <button className="mt-4 text-sm font-semibold text-violet-700" onClick={() => downloadCsv(entries)} type="button">Download current results as CSV</button>
        </Card>
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

function downloadCsv(entries: Array<Record<string, unknown>>) {
  const rows = entries.map((entry) => [formatDate(entry.createdAt), display(entry.action), display(entry.entityType), display(entry.entityId), display((entry.adminUser as { email?: unknown } | undefined)?.email ?? entry.adminUserId)]);
  const text = [["Time", "Action", "Entity type", "Entity ID", "Administrator"], ...rows].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "setu-audit-log.csv"; link.click(); URL.revokeObjectURL(url);
}
