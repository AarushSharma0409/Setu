"use client";

import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
  StatusBadge,
} from "@setu/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { publicApi } from "../lib/api-client";

export function InsuranceAssessmentReview({
  assessmentId,
}: {
  assessmentId: string;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_public_access_token") ?? "");
  const review = useQuery({
    queryKey: ["insurance-assessment-review", assessmentId],
    queryFn: () => publicApi.insuranceAssessmentReview(token, assessmentId),
    enabled: Boolean(token),
  });
  const [action, setAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function refresh() {
    await client.invalidateQueries({
      queryKey: ["insurance-assessment-review", assessmentId],
    });
  }
  async function acknowledge(id: string) {
    setAction(id);
    setError(null);
    try {
      await publicApi.acknowledgeInsuranceDisclosure(token, assessmentId, id);
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not record that acknowledgement.",
      );
    } finally {
      setAction(null);
    }
  }
  async function consent(id: string) {
    setAction(id);
    setError(null);
    try {
      await publicApi.grantInsuranceConsent(token, assessmentId, id);
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not record that consent.",
      );
    } finally {
      setAction(null);
    }
  }
  async function submit() {
    setAction("submit");
    setError(null);
    try {
      await publicApi.submitInsuranceAssessment(token, assessmentId);
      setMessage(
        "Your insurance profile is ready. You can now request available quotes when that service is enabled.",
      );
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not submit your assessment.",
      );
    } finally {
      setAction(null);
    }
  }
  async function getQuotes() {
    setAction("quotes");
    setError(null);
    try {
      const result = await publicApi.createInsuranceQuoteRequest(
        token,
        assessmentId,
        `web-${crypto.randomUUID()}`,
      );
      router.push(
        `/account/insurance/quotes?created=${encodeURIComponent(result.referenceNumber)}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Quotes could not be requested right now.",
      );
    } finally {
      setAction(null);
    }
  }
  if (!token)
    return (
      <PageContainer>
        <ErrorState
          title="Sign in to review"
          detail="Your assessment and disclosure decisions are private to your account."
        />
      </PageContainer>
    );
  if (review.isLoading)
    return (
      <PageContainer>
        <LoadingState label="Preparing your review" />
      </PageContainer>
    );
  if (review.error || !review.data)
    return (
      <PageContainer>
        <ErrorState
          title="Review unavailable"
          detail="The assessment may be expired or no longer available."
        />
      </PageContainer>
    );
  const data = review.data;
  const ready = data.completion.missingRequiredQuestions.length === 0;
  const disclosureReady = data.disclosures.items.every(
    (item) => !item.requiresAcknowledgement || item.acknowledgedAt,
  );
  const consentReady = data.consents.items.every(
    (item) => !item.required || item.record?.status === "GRANTED",
  );
  const submitted = data.assessment.status === "SUBMITTED";
  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl space-y-6 py-8 sm:py-12">
        <header className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/70 p-6">
          <p className="text-sm font-semibold text-violet-700">
            Setu Insurance · review
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Review before you continue
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Check your information, read the required disclosures, and choose
            your consent preferences. You can edit your answers before
            submitting.
          </p>
        </header>
        {error ? (
          <div className="setu-alert setu-alert-danger" role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="setu-alert setu-alert-success" role="status">
            {message}
          </div>
        ) : null}
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Your assessment</h2>
              <p className="mt-1 text-sm text-slate-600">
                Reference {data.assessment.referenceNumber} ·{" "}
                {data.assessment.completionPercentage}% complete
              </p>
            </div>
            <StatusBadge status={data.assessment.status} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {data.assessment.answers.map((answer) => (
              <div
                className="rounded-xl bg-slate-50 p-3"
                key={answer.questionKey}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {answer.questionKey.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatAnswer(answer.value)}
                </p>
              </div>
            ))}
          </div>
          {!submitted ? (
            <Link
              className="mt-5 inline-block text-sm font-medium text-violet-700 hover:underline"
              href={`/insurance/needs/${assessmentId}`}
            >
              Edit assessment
            </Link>
          ) : null}
        </Card>
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Important disclosures</h2>
            <p className="mt-1 text-sm text-slate-600">
              Please read each applicable disclosure. Required acknowledgements
              are clearly marked.
            </p>
          </div>
          {data.disclosures.items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Version {item.version}
                    {item.requiresAcknowledgement
                      ? " · acknowledgement required"
                      : ""}
                  </p>
                </div>
                {item.acknowledgedAt ? (
                  <StatusBadge status="ACKNOWLEDGED" />
                ) : null}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {item.content}
              </p>
              {item.requiresAcknowledgement && !item.acknowledgedAt ? (
                <Button
                  className="mt-4"
                  loading={action === item.id}
                  onClick={() => void acknowledge(item.id)}
                  variant="outline"
                >
                  I have read this disclosure
                </Button>
              ) : null}
            </Card>
          ))}
        </section>
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Your consent choices</h2>
            <p className="mt-1 text-sm text-slate-600">
              Required consent enables the service. Optional consent is kept
              separate.
            </p>
          </div>
          {data.consents.items.map((item) => {
            const granted = item.record?.status === "GRANTED";
            return (
              <Card key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Version {item.version} ·{" "}
                      {item.required ? "Required to continue" : "Optional"}
                    </p>
                  </div>
                  {granted ? <StatusBadge status="GRANTED" /> : null}
                </div>
                {item.description ? (
                  <p className="mt-3 text-sm text-slate-600">
                    {item.description}
                  </p>
                ) : null}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {item.content}
                </p>
                {!granted ? (
                  <Button
                    className="mt-4"
                    loading={action === item.id}
                    onClick={() => void consent(item.id)}
                    variant={item.required ? "primary" : "outline"}
                  >
                    {item.required ? "Agree and continue" : "Agree"}
                  </Button>
                ) : null}
              </Card>
            );
          })}
        </section>
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Ready to continue?</h2>
            <p className="mt-1 text-sm text-slate-600">
              Submitting creates your private insurance profile. It does not
              create a policy or guarantee insurer acceptance.
            </p>
          </div>
          {submitted ? (
            <Button
              loading={action === "quotes"}
              onClick={() => void getQuotes()}
            >
              Get available quotes
            </Button>
          ) : (
            <Button
              disabled={!ready || !disclosureReady || !consentReady}
              loading={action === "submit"}
              onClick={() => void submit()}
            >
              Submit insurance profile
            </Button>
          )}
        </Card>
      </main>
    </PageContainer>
  );
}

function formatAnswer(value: unknown) {
  if (value === null || value === undefined || value === "")
    return "Not provided";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return "Protected response";
  return typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
    ? value.toString()
    : "Protected response";
}
