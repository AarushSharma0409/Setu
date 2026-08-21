"use client";

import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageContainer,
} from "@setu/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { InsuranceHandoffAction } from "./insurance-handoff-action";
import { publicApi } from "../lib/api-client";

export function InsuranceComparison() {
  const params = useSearchParams();
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_public_access_token") ?? "");
  const [requestId, setRequestId] = useState(params.get("request") ?? "");
  const [sort, setSort] = useState("DEFAULT");
  const queryClient = useQueryClient();
  const comparison = useQuery({
    queryKey: ["insurance-comparison", requestId, sort],
    queryFn: () =>
      publicApi.insuranceComparison(token, requestId, `sort=${sort}`),
    enabled: Boolean(token && requestId),
  });
  async function toggle(id: string, saved: boolean) {
    if (saved) await publicApi.unsaveInsuranceQuote(token, id);
    else await publicApi.saveInsuranceQuote(token, id);
    await queryClient.invalidateQueries({ queryKey: ["insurance-comparison"] });
  }
  return (
    <PageContainer>
      <section className="mx-auto max-w-6xl space-y-6 py-10">
        <div>
          <p className="text-sm font-semibold text-violet-700">
            Setu Insurance
          </p>
          <h1 className="text-3xl font-semibold">Compare available quotes</h1>
          <p className="mt-2 text-slate-600">
            Sorting is neutral. It is not a recommendation or a guarantee of
            acceptance.
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            value={requestId}
            onChange={(event) => setRequestId(event.target.value)}
            placeholder="Quote request ID"
          />
          <select
            className="setu-input"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="DEFAULT">Insurer and product</option>
            <option value="LOWEST_PREMIUM">Lowest premium</option>
            <option value="HIGHEST_COVER">Highest cover</option>
            <option value="INSURER_NAME">Insurer name</option>
            <option value="PRODUCT_NAME">Product name</option>
          </select>
        </div>
        {!token ? (
          <ErrorState
            title="Sign in required"
            detail="Use development sign-in before viewing private quotes."
          />
        ) : comparison.isLoading ? (
          <LoadingState label="Loading available quotes" />
        ) : comparison.error ? (
          <ErrorState
            title="Comparison unavailable"
            detail="Check the quote request and insurance feature access."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {comparison.data?.items.map((quote) => (
              <Card key={quote.quoteId} className="space-y-3">
                <div>
                  <p className="font-semibold">{quote.product.name}</p>
                  <p className="text-sm text-slate-600">{quote.insurer.name}</p>
                </div>
                <p className="text-2xl font-semibold">
                  {quote.premium
                    ? `${quote.premium.currency} ${quote.premium.total}`
                    : "Premium unavailable"}
                </p>
                <dl className="space-y-1 text-sm text-slate-600">
                  <div>Cover: {quote.sumInsured ?? "Not specified"}</div>
                  <div>Deductible: {quote.deductible ?? "Not specified"}</div>
                  <div>
                    Waiting period: {quote.waitingPeriods ?? "Not specified"}
                  </div>
                </dl>
                <Button
                  variant="outline"
                  onClick={() => void toggle(quote.quoteId, quote.saved)}
                >
                  {quote.saved ? "Remove saved" : "Save quote"}
                </Button>
                <InsuranceHandoffAction
                  quoteId={quote.quoteId}
                  providerName={quote.insurer.name}
                  validUntil={quote.validUntil}
                />
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
