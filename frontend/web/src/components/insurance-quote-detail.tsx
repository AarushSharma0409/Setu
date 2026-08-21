"use client";

import {
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
  StatusBadge,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { InsuranceHandoffAction } from "./insurance-handoff-action";
import { publicApi } from "../lib/api-client";

export function InsuranceQuoteDetail({
  quoteRequestId,
}: {
  quoteRequestId: string;
}) {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_public_access_token") ?? "");
  const detail = useQuery({
    queryKey: ["insurance-quote-request", quoteRequestId],
    queryFn: () => publicApi.insuranceQuoteRequest(token, quoteRequestId),
    enabled: Boolean(token),
  });
  if (!token)
    return (
      <PageContainer>
        <ErrorState
          title="Sign in required"
          detail="Quote details are private to your account."
        />
      </PageContainer>
    );
  if (detail.isLoading)
    return (
      <PageContainer>
        <LoadingState label="Loading quote details" />
      </PageContainer>
    );
  if (detail.error || !detail.data)
    return (
      <PageContainer>
        <ErrorState
          title="Quote request unavailable"
          detail="Check your quote request or return to your insurance dashboard."
          action={
            <Link
              className="setu-button setu-button-outline setu-button-md"
              href="/account/insurance/quotes"
            >
              Back to quotes
            </Link>
          }
        />
      </PageContainer>
    );
  const quote = detail.data;
  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl space-y-6 py-8 sm:py-12">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-700">
              Setu Insurance · {quote.policyType.name}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Quote details
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Reference {quote.referenceNumber} · requested{" "}
              {new Date(quote.requestedAt).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={quote.status} />
        </header>
        <section className="grid gap-4 lg:grid-cols-2">
          {quote.quotes.map((item, index) => (
            <Card
              className="space-y-4"
              key={`${item.organizationName}-${index}`}
            >
              <div>
                <p className="font-semibold">{item.productName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.organizationName}
                </p>
              </div>
              <p className="text-2xl font-semibold">
                {item.totalPremium
                  ? `${item.currency ?? "INR"} ${item.totalPremium}`
                  : "Premium unavailable"}
              </p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Cover</dt>
                  <dd className="font-medium">
                    {item.sumInsured ?? "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Waiting period</dt>
                  <dd className="font-medium">
                    {item.waitingPeriodSummary ?? "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Coverage</dt>
                  <dd className="font-medium">
                    {item.coverageSummary ?? "See insurer details"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Exclusions</dt>
                  <dd className="font-medium">
                    {item.exclusionSummary ?? "See insurer details"}
                  </dd>
                </div>
              </dl>
              {item.validUntil ? (
                <InsuranceHandoffAction
                  quoteId={item.id}
                  providerName={item.organizationName}
                  validUntil={item.validUntil}
                />
              ) : null}
            </Card>
          ))}
        </section>
        <Link
          className="text-sm font-medium text-violet-700 hover:underline"
          href={`/account/insurance/comparison?request=${quoteRequestId}`}
        >
          Compare these quotes
        </Link>
      </main>
    </PageContainer>
  );
}
