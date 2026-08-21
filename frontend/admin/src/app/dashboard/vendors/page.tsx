"use client";

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  StatusBadge,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { ProtectedShell } from "../../../components/protected-shell";
import { adminApi } from "../../../lib/admin-api-client";

export default function AdminVendorsPage() {
  const [status, setStatus] = useState<
    "PENDING_REVIEW" | "APPROVED" | "SUSPENDED"
  >("PENDING_REVIEW");
  const token =
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem("setu_admin_access_token");
  const query = useQuery({
    enabled: Boolean(token),
    queryKey: ["admin-vendors", status],
    queryFn: () => adminApi.vendors(token ?? "", `status=${status}`),
  });

  const copy = {
    PENDING_REVIEW: {
      title: "Verification queue",
      description: "Submitted applications awaiting operational review.",
      emptyTitle: "Queue is clear",
      emptyDescription: "No vendor applications are waiting for review.",
    },
    APPROVED: {
      title: "Approved vendors",
      description: "Live vendor profiles. Open one to suspend it when a review requires it.",
      emptyTitle: "No approved vendors",
      emptyDescription: "Approved vendor profiles will appear here once verified.",
    },
    SUSPENDED: {
      title: "Suspended vendors",
      description: "Profiles currently hidden from public discovery. Open one to reactivate it.",
      emptyTitle: "No suspended vendors",
      emptyDescription: "Suspended vendor profiles will appear here for future review.",
    },
  }[status];

  return (
    <PageContainer>
      <ProtectedShell>
        <PageHeader
          eyebrow="Vendor operations"
          title={copy.title}
          description={copy.description}
        />
        <div className="setu-admin-vendor-segments" aria-label="Vendor status">
          {([
            ["PENDING_REVIEW", "Review queue"],
            ["APPROVED", "Approved vendors"],
            ["SUSPENDED", "Suspended"],
          ] as const).map(([value, label]) => (
            <button
              aria-pressed={status === value}
              className={status === value ? "is-active" : undefined}
              key={value}
              onClick={() => setStatus(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        {query.isLoading ? (
          <LoadingState label="Loading verification queue" />
        ) : null}
        {query.isError ? (
          <ErrorState
            title="Queue unavailable"
            detail="The API may be offline or your session may have expired."
          />
        ) : null}
        {query.data && query.data.items.length === 0 ? (
          <EmptyState
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        ) : null}
        {query.data && query.data.items.length > 0 ? (
          <>
            <Card className="hidden overflow-x-auto p-0 md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((vendor) => (
                    <tr
                      className="border-b border-slate-100"
                      key={vendor.vendorId}
                    >
                      <td className="px-4 py-3">
                        <Link
                          className="font-medium underline"
                          href={`/dashboard/vendors/${vendor.vendorId}`}
                        >
                          {vendor.businessName ?? "Unnamed vendor"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {vendor.owner.name ??
                          vendor.owner.email ??
                          vendor.owner.phone ??
                          "—"}
                      </td>
                      <td className="px-4 py-3">
                        {vendor.primaryCity
                          ? `${vendor.primaryCity.name}, ${vendor.primaryCity.state.name}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">{vendor.documentCount}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={vendor.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <div className="space-y-3 md:hidden">
              {query.data.items.map((vendor) => (
                <Card key={vendor.vendorId}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        className="font-semibold text-violet-700 underline-offset-4 hover:underline"
                        href={`/dashboard/vendors/${vendor.vendorId}`}
                      >
                        {vendor.businessName ?? "Unnamed vendor"}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        {vendor.primaryCity
                          ? `${vendor.primaryCity.name}, ${vendor.primaryCity.state.name}`
                          : "City not provided"}
                      </p>
                    </div>
                    <StatusBadge status={vendor.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Owner
                      </p>
                      <p className="mt-1">
                        {vendor.owner.name ??
                          vendor.owner.email ??
                          vendor.owner.phone ??
                          "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Documents
                      </p>
                      <p className="mt-1">{vendor.documentCount}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </ProtectedShell>
    </PageContainer>
  );
}
