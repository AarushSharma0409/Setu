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
import type { ReactNode } from "react";

import { ProtectedShell } from "./protected-shell";
import { adminApi } from "../lib/admin-api-client";

type Resource = "quotes" | "providers" | "callbacks" | "handoffs";

const titles: Record<Resource, { title: string; description: string }> = {
  quotes: {
    title: "Quote operations",
    description: "Investigate quote lifecycles and safe failure context.",
  },
  providers: {
    title: "Provider operations",
    description: "Review health and safe provider integration context.",
  },
  callbacks: {
    title: "Callback operations",
    description:
      "Inspect verification and processing state without raw payloads.",
  },
  handoffs: {
    title: "Handoff operations",
    description: "Review customer handoff history and external state safely.",
  },
};

function label(item: Record<string, unknown>) {
  return String(
    item.referenceNumber ?? item.reference ?? item.name ?? item.code ?? item.id,
  );
}

function status(item: Record<string, unknown>) {
  const value = item.status ?? item.healthStatus ?? item.processingStatus;
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "Recorded";
}

function OperationsFrame({ children }: { children: ReactNode }) {
  return (
    <PageContainer>
      <ProtectedShell>{children}</ProtectedShell>
    </PageContainer>
  );
}

export function InsuranceOperationsListPage({
  resource,
}: {
  resource: Resource;
}) {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_admin_access_token") ?? "");
  const title = titles[resource];
  const list = useQuery({
    queryKey: ["insurance-operations", resource],
    queryFn: () => adminApi.insuranceOperationsList(token, resource),
    enabled: Boolean(token),
  });
  if (!token)
    return (
      <OperationsFrame>
      <ErrorState
        title="Sign in required"
        detail="Your MFA-backed admin session is required."
      />
      </OperationsFrame>
    );
  if (list.isLoading)
    return (
      <OperationsFrame>
        <LoadingState label={`Loading ${title.title.toLowerCase()}`} />
      </OperationsFrame>
    );
  if (list.error)
    return (
      <OperationsFrame>
        <ErrorState
          title="Operations unavailable"
          detail="Check the feature flag and your permission."
        />
      </OperationsFrame>
    );
  return (
    <OperationsFrame>
      <section className="space-y-6">
        <PageHeader
          eyebrow="Insurance operations"
          title={title.title}
          description={title.description}
        />
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Reference</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.data?.items.map((item) => (
                  <tr className="border-b" key={String(item.id)}>
                    <td className="p-3 font-medium">{label(item)}</td>
                    <td className="p-3">{status(item)}</td>
                    <td className="p-3 text-right">
                      <Link
                        className="text-violet-700 hover:underline"
                        href={`/insurance/operations/${resource}/${String(item.id)}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.data?.items.length === 0 ? (
              <p className="p-4 text-sm text-slate-600">
                No records match this operational view.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </OperationsFrame>
  );
}
