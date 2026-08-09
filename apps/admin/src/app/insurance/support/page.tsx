"use client";

import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
} from "@setu/ui";
import { useState } from "react";

import { adminApi } from "../../../lib/admin-api-client";

export default function InsuranceSupportPage() {
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_admin_access_token") ?? "");
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function search() {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await adminApi.insuranceSupportSearch(
          token,
          new URLSearchParams({ reference }).toString(),
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }
  if (!token)
    return (
      <ErrorState
        title="Sign in required"
        detail="Your MFA-backed admin session is required."
      />
    );
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Insurance support"
        title="Customer lookup"
        description="Search exact assessment, quote, or handoff references. Sensitive answers are never loaded."
      />
      <Card className="space-y-3">
        <label className="text-sm font-medium" htmlFor="reference">
          Reference
        </label>
        <div className="flex gap-2">
          <Input
            id="reference"
            onChange={(event) => setReference(event.target.value)}
            placeholder="Assessment, quote, or handoff reference"
            value={reference}
          />
          <Button
            disabled={reference.trim().length < 6}
            loading={loading}
            onClick={() => void search()}
          >
            Search
          </Button>
        </div>
        {error ? (
          <ErrorState title="Lookup unavailable" detail={error} />
        ) : null}
      </Card>
      {loading ? (
        <LoadingState label="Searching protected records" />
      ) : result ? (
        <Card>
          <pre className="overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      ) : null}
    </section>
  );
}
