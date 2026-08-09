"use client";

import { Card, ErrorState, LoadingState, PageContainer } from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { publicApi } from "../../../../lib/api-client";

export default function InsuranceHandoffReturnPage() {
  const params = useSearchParams();
  const state = params.get("state") ?? "";
  const result = useQuery({
    queryKey: ["insurance-handoff-return", state],
    queryFn: () => publicApi.insuranceHandoffReturn(state),
    enabled: Boolean(state),
  });
  return (
    <PageContainer>
      <section className="mx-auto max-w-xl space-y-5 py-16">
        <p className="text-sm font-semibold text-violet-700">Setu Insurance</p>
        {!state ? (
          <ErrorState
            title="Return link is incomplete"
            detail="This handoff session cannot be verified."
          />
        ) : result.isLoading ? (
          <LoadingState label="Verifying your return" />
        ) : result.error ? (
          <ErrorState
            title="Handoff session unavailable"
            detail="The session may have expired. Your quote has not been changed."
          />
        ) : (
          <Card className="space-y-3">
            <h1 className="text-2xl font-semibold">
              You returned from {result.data?.providerName}
            </h1>
            <p className="text-slate-600">
              Status: {String(result.data?.status).replaceAll("_", " ")}. A
              redirect or return does not confirm that a policy was purchased or
              issued.
            </p>
            <p className="text-sm text-slate-500">
              Reference: {result.data?.referenceNumber}
            </p>
          </Card>
        )}
      </section>
    </PageContainer>
  );
}
