"use client";

import {
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ProtectedShell } from "./protected-shell";
import { adminApi } from "../lib/admin-api-client";

type Resource = "quotes" | "providers" | "callbacks" | "handoffs";

function displayValue(value: unknown) {
  return typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
    ? String(value)
    : "—";
}

function OperationsDetailFrame({ children }: { children: ReactNode }) {
  return (
    <PageContainer>
      <ProtectedShell>{children}</ProtectedShell>
    </PageContainer>
  );
}

export function InsuranceOperationsDetailPage({
  resource,
  id,
}: {
  resource: Resource;
  id: string;
}) {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_admin_access_token") ?? "");
  const detail = useQuery({
    queryKey: ["insurance-operations", resource, id],
    queryFn: () => adminApi.insuranceOperationsDetail(token, resource, id),
    enabled: Boolean(token),
  });
  if (!token)
    return (
      <OperationsDetailFrame>
        <ErrorState
          title="Sign in required"
          detail="Your MFA-backed admin session is required."
        />
      </OperationsDetailFrame>
    );
  if (detail.isLoading)
    return (
      <OperationsDetailFrame>
        <LoadingState label="Loading protected operational context" />
      </OperationsDetailFrame>
    );
  if (detail.error)
    return (
      <OperationsDetailFrame>
        <ErrorState
          title="Record unavailable"
          detail="The record is unavailable or you do not have permission to inspect it."
        />
      </OperationsDetailFrame>
    );
  return (
    <OperationsDetailFrame>
      <section className="space-y-6">
        <PageHeader
          eyebrow="Insurance operations"
          title={`${resource.slice(0, -1)} detail`}
          description="Safe operational metadata only. Credentials, raw payloads, tokens, and sensitive answers remain hidden."
        />
        <Card>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {Object.entries(detail.data ?? {})
              .filter(([, value]) => typeof value !== "object" || value === null)
              .map(([key, value]) => (
                <div key={key}>
                  <dt className="text-slate-500">
                    {key.replaceAll(/([A-Z])/g, " $1")}
                  </dt>
                  <dd className="break-words font-medium">
                    {displayValue(value)}
                  </dd>
                </div>
              ))}
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold">Structured operational context</h2>
          <pre className="mt-3 overflow-auto text-xs">
            {JSON.stringify(detail.data, null, 2)}
          </pre>
        </Card>
      </section>
    </OperationsDetailFrame>
  );
}
