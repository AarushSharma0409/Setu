"use client";

import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
} from "@setu/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { InsuranceHandoffAction } from "./insurance-handoff-action";
import { publicApi } from "../lib/api-client";

export function SavedInsuranceQuotes() {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_public_access_token") ?? "");
  const client = useQuery({
    queryKey: ["saved-insurance-quotes"],
    queryFn: () => publicApi.savedInsuranceQuotes(token),
    enabled: Boolean(token),
  });
  const queryClient = useQueryClient();
  if (!token)
    return (
      <PageContainer>
        <ErrorState
          title="Sign in required"
          detail="Use development sign-in before viewing saved quotes."
        />
      </PageContainer>
    );
  if (client.isLoading)
    return (
      <PageContainer>
        <LoadingState label="Loading saved quotes" />
      </PageContainer>
    );
  if (client.error)
    return (
      <PageContainer>
        <ErrorState
          title="Saved quotes unavailable"
          detail="This private feature has not been enabled."
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <section className="mx-auto max-w-4xl space-y-5 py-10">
        <div>
          <p className="text-sm font-semibold text-violet-700">
            Setu Insurance
          </p>
          <h1 className="text-3xl font-semibold">Saved quotes</h1>
        </div>
        {client.data?.items.length ? (
          client.data.items.map(({ id, quote, savedAt }) => (
            <Card
              key={id}
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold">{quote.productVersion.name}</p>
                <p className="text-sm text-slate-600">
                  {quote.organization.tradeName ?? quote.organization.legalName}{" "}
                  · {quote.currency ?? "INR"}{" "}
                  {quote.totalPremium ?? "Unavailable"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Saved {new Date(savedAt).toLocaleDateString()} ·{" "}
                  {quote.validUntil && new Date(quote.validUntil) < new Date()
                    ? "Expired - request fresh quotes"
                    : `Current status: ${quote.status}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <InsuranceHandoffAction
                  quoteId={quote.id}
                  providerName={
                    quote.organization.tradeName ?? quote.organization.legalName
                  }
                  validUntil={quote.validUntil}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    void publicApi
                      .unsaveInsuranceQuote(token, quote.id)
                      .then(() =>
                        queryClient.invalidateQueries({
                          queryKey: ["saved-insurance-quotes"],
                        }),
                      )
                  }
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-slate-600">No saved quotes yet.</p>
          </Card>
        )}
      </section>
    </PageContainer>
  );
}
