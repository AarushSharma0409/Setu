"use client";

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

import { adminApi, type InsuranceDashboard } from "../lib/admin-api-client";

export type InsuranceView =
  | "dashboard"
  | "operating-model"
  | "organizations"
  | "policy-types"
  | "disclosures"
  | "consent-templates"
  | "audit-logs"
  | "organization-detail"
  | "disclosure-detail"
  | "consent-template-detail";

function token() {
  return typeof window === "undefined"
    ? ""
    : (sessionStorage.getItem("setu_admin_access_token") ?? "");
}

function QueryState({
  children,
  pending,
}: {
  children: ReactNode;
  pending: boolean;
}) {
  if (pending) return <LoadingState label="Loading insurance administration" />;
  return <>{children}</>;
}

export function InsuranceWorkspace({
  view,
  id,
}: {
  view: InsuranceView;
  id?: string;
}) {
  const accessToken = token();
  const [search, setSearch] = useState("");
  const dashboard = useQuery({
    queryKey: ["insurance", "dashboard"],
    enabled: view === "dashboard" && Boolean(accessToken),
    queryFn: () => adminApi.insuranceDashboard(accessToken),
  });
  const operatingModels = useQuery({
    queryKey: ["insurance", "operating-model"],
    enabled: view === "operating-model" && Boolean(accessToken),
    queryFn: () => adminApi.insuranceOperatingModels(accessToken),
  });
  const organizations = useQuery({
    queryKey: ["insurance", "organizations", search],
    enabled: view === "organizations" && Boolean(accessToken),
    queryFn: () =>
      adminApi.insuranceOrganizations(
        accessToken,
        search ? `search=${encodeURIComponent(search)}` : "",
      ),
  });
  const policyTypes = useQuery({
    queryKey: ["insurance", "policy-types"],
    enabled: view === "policy-types" && Boolean(accessToken),
    queryFn: () => adminApi.insurancePolicyTypes(accessToken),
  });
  const disclosures = useQuery({
    queryKey: ["insurance", "disclosures"],
    enabled: view === "disclosures" && Boolean(accessToken),
    queryFn: () => adminApi.insuranceDisclosures(accessToken),
  });
  const consents = useQuery({
    queryKey: ["insurance", "consents"],
    enabled: view === "consent-templates" && Boolean(accessToken),
    queryFn: () => adminApi.insuranceConsentTemplates(accessToken),
  });
  const organization = useQuery({
    queryKey: ["insurance", "organization", id],
    enabled:
      view === "organization-detail" && Boolean(accessToken) && Boolean(id),
    queryFn: () => adminApi.insuranceOrganization(accessToken, id ?? ""),
  });
  const disclosure = useQuery({
    queryKey: ["insurance", "disclosure", id],
    enabled:
      view === "disclosure-detail" && Boolean(accessToken) && Boolean(id),
    queryFn: () => adminApi.insuranceDisclosure(accessToken, id ?? ""),
  });
  const consent = useQuery({
    queryKey: ["insurance", "consent", id],
    enabled:
      view === "consent-template-detail" && Boolean(accessToken) && Boolean(id),
    queryFn: () => adminApi.insuranceConsentTemplate(accessToken, id ?? ""),
  });

  if (!accessToken)
    return (
      <ErrorState
        title="Session required"
        detail="Sign in again to access insurance administration."
      />
    );
  if (view === "dashboard")
    return (
      <Dashboard
        data={dashboard.data}
        pending={dashboard.isLoading}
        error={dashboard.isError}
      />
    );
  if (view === "operating-model")
    return (
      <OperatingModels
        items={operatingModels.data?.items ?? []}
        pending={operatingModels.isLoading}
        error={operatingModels.isError}
      />
    );
  if (view === "organizations")
    return (
      <Organizations
        items={organizations.data?.items ?? []}
        pending={organizations.isLoading}
        error={organizations.isError}
        search={search}
        onSearch={setSearch}
      />
    );
  if (view === "policy-types")
    return (
      <PolicyTypes
        items={policyTypes.data?.items ?? []}
        pending={policyTypes.isLoading}
        error={policyTypes.isError}
      />
    );
  if (view === "disclosures")
    return (
      <Templates
        kind="disclosure"
        items={disclosures.data?.items ?? []}
        pending={disclosures.isLoading}
        error={disclosures.isError}
      />
    );
  if (view === "consent-templates")
    return (
      <Templates
        kind="consent"
        items={consents.data?.items ?? []}
        pending={consents.isLoading}
        error={consents.isError}
      />
    );
  if (view === "organization-detail")
    return (
      <Detail
        title={String(organization.data?.legalName ?? "Insurance organization")}
        data={organization.data}
        pending={organization.isLoading}
        error={organization.isError}
      />
    );
  if (view === "disclosure-detail")
    return (
      <Detail
        title={String(disclosure.data?.name ?? "Disclosure")}
        data={disclosure.data}
        pending={disclosure.isLoading}
        error={disclosure.isError}
      />
    );
  if (view === "consent-template-detail")
    return (
      <Detail
        title={String(consent.data?.name ?? "Consent template")}
        data={consent.data}
        pending={consent.isLoading}
        error={consent.isError}
      />
    );
  return <InsuranceAudit />;
}

function Dashboard({
  data,
  pending,
  error,
}: {
  data?: InsuranceDashboard;
  pending: boolean;
  error: boolean;
}) {
  if (error) return <Unavailable />;
  const cards: Array<[keyof InsuranceDashboard, string, string]> = [
    [
      "activeOperatingModel",
      "Active operating model",
      "/insurance/operating-model",
    ],
    [
      "organizationsPendingVerification",
      "Pending organizations",
      "/insurance/organizations",
    ],
    ["activeInsurers", "Active insurers", "/insurance/organizations"],
    [
      "activeIntermediaries",
      "Active intermediaries",
      "/insurance/organizations",
    ],
    [
      "licencesExpiringSoon",
      "Licences expiring soon",
      "/insurance/organizations",
    ],
    ["activePolicyTypes", "Active policy types", "/insurance/policy-types"],
    ["publishedDisclosures", "Published disclosures", "/insurance/disclosures"],
    [
      "publishedConsentTemplates",
      "Published consent templates",
      "/insurance/consent-templates",
    ],
  ];
  return (
    <QueryState pending={pending}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([key, label, href]) => (
          <Link href={href} key={key}>
            <Card className="setu-card-interactive">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{data?.[key] ?? 0}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-6">
        <p className="font-semibold">
          Insurance administration is configuration-only
        </p>
        <p className="mt-2 text-sm text-slate-600">
          No customer quotations, products, payments, purchases, policy
          issuance, or claims are enabled from this workspace.
        </p>
      </Card>
    </QueryState>
  );
}

function OperatingModels({
  items,
  pending,
  error,
}: {
  items: Array<{
    id: string;
    legalEntityName: string;
    operatingRole: string;
    status: string;
    configurationVersion: number;
    licenceValidUntil: string | null;
  }>;
  pending: boolean;
  error: boolean;
}) {
  if (error) return <Unavailable />;
  return (
    <QueryState pending={pending}>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.legalEntityName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.operatingRole.replaceAll("_", " ")} · Version{" "}
                    {item.configurationVersion}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Licence valid until:{" "}
                {item.licenceValidUntil
                  ? new Date(item.licenceValidUntil).toLocaleDateString()
                  : "Not recorded"}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No operating model configured"
          description="Create a draft only after legal and regulatory information has been approved."
        />
      )}
    </QueryState>
  );
}

function Organizations({
  items,
  pending,
  error,
  search,
  onSearch,
}: {
  items: Array<{
    id: string;
    legalName: string;
    tradeName: string | null;
    type: string;
    status: string;
    registrationNumber: string;
    registrationValidUntil: string | null;
    insuranceLines?: Array<{ name: string }>;
  }>;
  pending: boolean;
  error: boolean;
  search: string;
  onSearch: (value: string) => void;
}) {
  if (error) return <Unavailable />;
  return (
    <QueryState pending={pending}>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="setu-input max-w-md"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search name or registration number"
        />
        <Button variant="outline" type="button" onClick={() => onSearch("")}>
          Clear
        </Button>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              className="block"
              href={`/insurance/organizations/${item.id}`}
              key={item.id}
            >
              <Card className="setu-card-interactive">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.legalName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.type.replaceAll("_", " ")} ·{" "}
                      {item.registrationNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.insuranceLines
                        ?.map((line) => line.name)
                        .join(", ") || "No lines selected"}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No insurance organizations"
          description="Organizations remain private and are never published to the public marketplace."
        />
      )}
    </QueryState>
  );
}

function PolicyTypes({
  items,
  pending,
  error,
}: {
  items: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    insuranceLine: { name: string };
  }>;
  pending: boolean;
  error: boolean;
}) {
  if (error) return <Unavailable />;
  return (
    <QueryState pending={pending}>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-600">
                    {item.insuranceLine.name} · {item.code}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No policy types"
          description="Policy types are configuration records only; they do not create products."
        />
      )}
    </QueryState>
  );
}

function Templates({
  kind,
  items,
  pending,
  error,
}: {
  kind: "disclosure" | "consent";
  items: Array<{
    id: string;
    code: string;
    name: string;
    purpose: string;
    status: string;
    version: number;
  }>;
  pending: boolean;
  error: boolean;
}) {
  if (error) return <Unavailable />;
  return (
    <QueryState pending={pending}>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              className="block"
              href={`/insurance/${kind === "disclosure" ? "disclosures" : "consent-templates"}/${item.id}`}
              key={item.id}
            >
              <Card className="setu-card-interactive">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-slate-600">
                      {item.code} · {item.purpose.replaceAll("_", " ")} · v
                      {item.version}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${kind}s`}
          description="Draft and published versions stay controlled and immutable once published."
        />
      )}
    </QueryState>
  );
}

function Detail({
  title,
  data,
  pending,
  error,
}: {
  title: string;
  data: object | undefined;
  pending: boolean;
  error: boolean;
}) {
  if (error) return <Unavailable />;
  return (
    <QueryState pending={pending}>
      <Card>
        <h2 className="setu-section-title">{title}</h2>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {Object.entries(data ?? {})
            .filter(([key]) => !["id", "storageKey", "metadata"].includes(key))
            .map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {key.replace(/([A-Z])/g, " $1")}
                </dt>
                <dd className="mt-1 break-words text-slate-800">
                  {formatValue(value)}
                </dd>
              </div>
            ))}
        </dl>
      </Card>
    </QueryState>
  );
}

function InsuranceAudit() {
  return (
    <Card>
      <p className="font-semibold">Insurance audit history</p>
      <p className="mt-2 text-sm text-slate-600">
        Configuration, document access, publishing, and organization decisions
        are recorded through the shared append-only audit boundary.
      </p>
    </Card>
  );
}
function Unavailable() {
  return (
    <ErrorState
      title="Insurance administration unavailable"
      detail="It is disabled by default until server-side feature flags and an approved operating model are intentionally configured."
    />
  );
}
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return "Restricted structured data";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value.toString();
  }
  return "Restricted value";
}
