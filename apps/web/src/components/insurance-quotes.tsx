"use client";

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  StatusBadge,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { publicApi } from "../lib/api-client";

export function InsuranceQuotes() {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_public_access_token") ?? "");
  const params = useSearchParams();
  const created = params.get("created");
  const quotes = useQuery({
    queryKey: ["insurance-quote-requests"],
    queryFn: () => publicApi.insuranceQuoteRequests(token),
    enabled: Boolean(token),
  });
  if (!token)
    return (
      <PageContainer>
        <ErrorState
          title="Sign in to view quotes"
          detail="Your available quotes are private to your account."
        />
      </PageContainer>
    );
  if (quotes.isLoading)
    return (
      <PageContainer>
        <LoadingState label="Loading quote requests" />
      </PageContainer>
    );
  if (quotes.error)
    return (
      <PageContainer>
        <ErrorState
          title="Quotes are unavailable"
          detail="Try again once the insurance service is enabled."
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl space-y-6 py-8 sm:py-12">
        <header className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/70 p-6">
          <p className="text-sm font-semibold text-violet-700">
            Setu Insurance
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Your quote requests
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Available quotes are based on your submitted profile. They are not
            an insurer decision or a guarantee of cover.
          </p>
        </header>
        {created ? (
          <div className="setu-alert setu-alert-success" role="status">
            Quote request {created} has been created. It may take a moment for
            available options to appear.
          </div>
        ) : null}
        {quotes.data?.items.length ? (
          <section className="space-y-3">
            {quotes.data.items.map((item) => (
              <Card className="setu-card-interactive" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{item.policyType.name}</h2>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {item.generatedQuoteCount} option
                      {item.generatedQuoteCount === 1 ? "" : "s"} available ·
                      Requested{" "}
                      {new Date(item.requestedAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Reference {item.referenceNumber}
                      {item.expiresAt
                        ? ` · Valid until ${new Date(item.expiresAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="setu-button setu-button-outline setu-button-md"
                      href={`/account/insurance/quotes/${item.id}`}
                    >
                      View details
                    </Link>
                    <Link
                      className="setu-button setu-button-primary setu-button-md"
                      href={`/account/insurance/comparison?request=${item.id}`}
                    >
                      Compare quotes
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <EmptyState
            title="No quote requests yet"
            description="Complete and submit an insurance assessment to request available quotes."
            action={
              <Link
                className="setu-button setu-button-primary setu-button-md"
                href="/account/insurance"
              >
                Open insurance dashboard
              </Link>
            }
          />
        )}
      </main>
    </PageContainer>
  );
}
