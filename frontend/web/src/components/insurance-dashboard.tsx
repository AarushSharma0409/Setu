"use client";

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageContainer,
  StatusBadge,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { publicApi } from "../lib/api-client";

export function InsuranceDashboard() {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_public_access_token") ?? "");
  const assessments = useQuery({
    queryKey: ["insurance-assessments"],
    queryFn: () => publicApi.insuranceAssessments(token),
    enabled: Boolean(token),
  });
  const quotes = useQuery({
    queryKey: ["insurance-quote-requests"],
    queryFn: () => publicApi.insuranceQuoteRequests(token),
    enabled: Boolean(token),
  });
  const saved = useQuery({
    queryKey: ["saved-insurance-quotes"],
    queryFn: () => publicApi.savedInsuranceQuotes(token),
    enabled: Boolean(token),
  });
  if (!token)
    return (
      <PageContainer>
        <main className="setu-insurance-dashboard-preview mx-auto max-w-6xl py-8 sm:py-12">
          <header className="setu-insurance-overview-hero">
            <div>
              <p className="text-sm font-semibold text-violet-700">
                Setu Insurance
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Explore your insurance journey
              </h1>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                Understand the steps, browse available policy types, and decide
                when you want to create a private account-backed assessment.
              </p>
            </div>
            <div className="setu-insurance-preview-assurance">
              <span className="setu-insurance-preview-assurance-icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <p>Explore freely</p>
                <strong>Your details are only needed when you request quotes.</strong>
              </div>
              <div className="setu-insurance-preview-assurance-points" aria-label="Available without an account">
                <span>Policy types</span>
                <span>Coverage guides</span>
              </div>
            </div>
          </header>
          <section className="setu-insurance-preview-grid">
            <Card className="setu-insurance-preview-card">
              <p className="text-sm font-semibold text-violet-700">
                1. Explore
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Browse policy types
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                See the insurance types currently available before entering any
                personal information.
              </p>
              <Link
                className="mt-5 inline-block text-sm font-semibold text-violet-700 hover:underline"
                href="/insurance"
              >
                Browse policy types
              </Link>
            </Card>
            <Card className="setu-insurance-preview-card">
              <p className="text-sm font-semibold text-violet-700">
                2. Prepare
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Save your assessment
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in only when you are ready to save answers and request
                quotes based on your needs.
              </p>
            </Card>
            <Card className="setu-insurance-preview-card">
              <p className="text-sm font-semibold text-violet-700">
                3. Compare
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Review private quotes
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Quote requests and comparisons are account-only because they use
                your submitted assessment.
              </p>
            </Card>
          </section>
          <Card className="setu-insurance-preview-cta">
            <div>
              <h2 className="text-lg font-semibold">Ready to continue?</h2>
              <p className="mt-1 text-sm text-slate-600">
                Sign in to begin a private assessment, request quotes, and save
                options for later.
              </p>
            </div>
            <Link
              className="setu-button setu-button-primary setu-button-md"
              href="/auth?returnTo=%2Faccount%2Finsurance"
            >
              Sign in to start
            </Link>
          </Card>
        </main>
      </PageContainer>
    );
  if (assessments.isLoading || quotes.isLoading || saved.isLoading)
    return (
      <PageContainer>
        <LoadingState label="Loading your insurance journey" />
      </PageContainer>
    );
  if (assessments.error || quotes.error || saved.error)
    return (
      <PageContainer>
        <ErrorState
          title="Insurance dashboard unavailable"
          detail="The feature may be disabled or temporarily unavailable."
        />
      </PageContainer>
    );
  const active = assessments.data?.items.find((item) =>
    ["DRAFT", "IN_PROGRESS", "READY_FOR_REVIEW"].includes(item.status),
  );
  const latestQuote = quotes.data?.items[0];
  return (
    <PageContainer>
      <main className="mx-auto max-w-6xl space-y-7 py-8 sm:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-700">
              Setu Insurance
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Your insurance journey
            </h1>
            <p className="mt-2 text-slate-600">
              Pick up where you left off, review quotes, or revisit your saved
              options.
            </p>
          </div>
          <Link
            className="setu-button setu-button-primary setu-button-md"
            href="/insurance"
          >
            Explore insurance
          </Link>
        </header>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Assessment progress"
            value={active ? `${active.completionPercentage}%` : "—"}
            detail={active ? active.policyType.name : "No active assessment"}
          />
          <Metric
            label="Available quotes"
            value={String(latestQuote?.generatedQuoteCount ?? 0)}
            detail={
              latestQuote ? latestQuote.policyType.name : "No quote requests"
            }
          />
          <Metric
            label="Saved quotes"
            value={String(saved.data?.items.length ?? 0)}
            detail="Available for review"
          />
          <Metric
            label="Latest quote validity"
            value={
              latestQuote?.expiresAt ? formatDate(latestQuote.expiresAt) : "—"
            }
            detail={latestQuote ? "Check quote status" : "No active quote"}
          />
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Continue your assessment
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Your entered information remains private while you complete
                  the required steps.
                </p>
              </div>
              {active ? <StatusBadge status={active.status} /> : null}
            </div>
            {active ? (
              <div className="mt-5">
                <p className="text-sm font-medium">
                  {active.policyType.name} · {active.completionPercentage}%
                  complete
                </p>
                <div className="setu-progress mt-2">
                  <span style={{ width: `${active.completionPercentage}%` }} />
                </div>
                <Link
                  className="setu-button setu-button-primary setu-button-md mt-5"
                  href={`/insurance/needs/${active.id}`}
                >
                  Resume assessment
                </Link>
              </div>
            ) : (
              <EmptyState
                title="No assessment in progress"
                description="Choose a policy type to start a saveable assessment."
                action={
                  <Link
                    className="setu-button setu-button-outline setu-button-md"
                    href="/insurance"
                  >
                    Browse policy types
                  </Link>
                }
              />
            )}
          </Card>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Recent quote request</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Quotes are subject to provider checks and are not a policy
                  decision.
                </p>
              </div>
              {latestQuote ? <StatusBadge status={latestQuote.status} /> : null}
            </div>
            {latestQuote ? (
              <div className="mt-5 space-y-2 text-sm">
                <p className="font-medium">{latestQuote.policyType.name}</p>
                <p className="text-slate-600">
                  {latestQuote.generatedQuoteCount} quote
                  {latestQuote.generatedQuoteCount === 1 ? "" : "s"} available ·{" "}
                  {latestQuote.referenceNumber}
                </p>
                <Link
                  className="inline-block font-medium text-violet-700 hover:underline"
                  href="/account/insurance/quotes"
                >
                  View quote requests
                </Link>
              </div>
            ) : (
              <EmptyState
                title="No quotes yet"
                description="Submit a completed assessment to request available quotes."
              />
            )}
          </Card>
        </section>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Saved quotes</h2>
              <p className="mt-1 text-sm text-slate-600">
                Keep options you want to revisit before continuing with an
                insurer.
              </p>
            </div>
            <Link
              className="text-sm font-medium text-violet-700 hover:underline"
              href="/account/insurance/saved-quotes"
            >
              View saved quotes
            </Link>
          </div>
        </Card>
      </main>
    </PageContainer>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return <MetricCard detail={detail} label={label} value={value} />;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}
