"use client";

import { Button, ErrorState } from "@setu/ui";
import { useState } from "react";

import { publicApi } from "../lib/api-client";

export function InsuranceHandoffAction({
  quoteId,
  providerName,
  validUntil,
}: {
  quoteId: string;
  providerName: string;
  validUntil: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expired = !validUntil || new Date(validUntil) <= new Date();
  async function continueToProvider() {
    const token = sessionStorage.getItem("setu_public_access_token");
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const handoff = await publicApi.createInsuranceHandoff(token, quoteId);
      await publicApi.recordInsuranceHandoffRedirect(token, handoff.handoffId);
      window.location.assign(handoff.redirectUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not prepare the handoff right now. Your quote has not changed.",
      );
    } finally {
      setLoading(false);
    }
  }
  if (expired)
    return (
      <p className="text-sm text-slate-600">
        This quote has expired. Refresh your quotes to continue.
      </p>
    );
  if (!confirming)
    return (
      <Button variant="outline" onClick={() => setConfirming(true)}>
        Continue with insurer
      </Button>
    );
  return (
    <div
      className="space-y-3 rounded-lg border border-violet-200 bg-violet-50 p-3"
      role="region"
      aria-label="Secure continuation confirmation"
    >
      <p className="text-sm text-slate-700">
        You will leave Setu and continue securely with {providerName}. Your
        quote remains subject to the provider&apos;s final checks.
      </p>
      <div className="flex gap-2">
        <Button loading={loading} onClick={() => void continueToProvider()}>
          Continue securely
        </Button>
        <Button
          disabled={loading}
          variant="outline"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
      {error ? (
        <ErrorState title="Continuation unavailable" detail={error} />
      ) : null}
    </div>
  );
}
