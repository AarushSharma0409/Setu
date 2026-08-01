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

import { ProtectedShell } from "../../../components/protected-shell";
import { adminApi } from "../../../lib/admin-api-client";

export default function AdminVendorsPage() {
  const token =
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem("setu_admin_access_token");
  const query = useQuery({
    enabled: Boolean(token),
    queryKey: ["admin-verification-queue"],
    queryFn: () => adminApi.verificationQueue(token ?? ""),
  });

  return (
    <PageContainer>
      <ProtectedShell>
        <PageHeader
          eyebrow="Vendor verification"
          title="Verification queue"
          description="Submitted applications awaiting operational review."
        />
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
            title="Queue is clear"
            description="No vendor applications are waiting for review."
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
                      <td className="px-4 py-3">{vendor.status}</td>
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
                        className="font-semibold text-blue-700 underline-offset-4 hover:underline"
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
