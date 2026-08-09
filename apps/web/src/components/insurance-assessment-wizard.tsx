"use client";

import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
} from "@setu/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { publicApi, type InsuranceQuestion } from "../lib/api-client";

type AnswerMap = Record<string, unknown>;

function visible(question: InsuranceQuestion, answers: AnswerMap) {
  const config = question.visibilityConfig;
  if (!config || typeof config !== "object" || Array.isArray(config))
    return true;
  const rule = config as Record<string, unknown>;
  if (typeof rule.questionKey !== "string" || typeof rule.operator !== "string")
    return true;
  const actual = answers[rule.questionKey];
  if (rule.operator === "EQUALS") return actual === rule.value;
  if (rule.operator === "NOT_EQUALS") return actual !== rule.value;
  if (rule.operator === "IS_TRUE") return actual === true;
  if (rule.operator === "IS_FALSE") return actual === false;
  if (rule.operator === "IN")
    return Array.isArray(rule.value) && rule.value.includes(actual);
  if (rule.operator === "NOT_IN")
    return Array.isArray(rule.value) && !rule.value.includes(actual);
  return true;
}

function hasAnswer(value: unknown) {
  return (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    (!Array.isArray(value) || value.length > 0)
  );
}

function isNumeric(question: InsuranceQuestion) {
  return question.fieldType === "NUMBER" || question.fieldType === "CURRENCY";
}

function normalise(question: InsuranceQuestion, value: unknown) {
  if (isNumeric(question) && typeof value === "string" && value.trim())
    return Number(value);
  return value;
}

export function InsuranceAssessmentWizard({
  assessmentId,
}: {
  assessmentId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("setu_public_access_token") ?? "");
  const schema = useQuery({
    queryKey: ["insurance-assessment-schema", assessmentId],
    queryFn: () => publicApi.insuranceAssessmentSchema(token, assessmentId),
    enabled: Boolean(token),
  });
  const detail = useQuery({
    queryKey: ["insurance-assessment", assessmentId],
    queryFn: () => publicApi.insuranceAssessment(token, assessmentId),
    enabled: Boolean(token),
  });
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    if (!detail.data || Object.keys(answers).length) return;
    setAnswers(
      Object.fromEntries(
        detail.data.answers.map((answer) => [answer.questionKey, answer.value]),
      ),
    );
  }, [answers, detail.data]);

  const sections = useMemo(
    () => schema.data?.schema.sections ?? [],
    [schema.data],
  );
  useEffect(() => {
    const current = schema.data?.assessment.currentSectionKey;
    const index = sections.findIndex((section) => section.key === current);
    if (index > -1) setSectionIndex(index);
  }, [schema.data?.assessment.currentSectionKey, sections]);

  const section = sections[sectionIndex];
  const questions = useMemo(
    () =>
      section?.questions.filter((question) => visible(question, answers)) ?? [],
    [answers, section],
  );
  const percent = schema.data?.assessment.completionPercentage ?? 0;
  const update = (key: string, value: unknown) =>
    setAnswers((previous) => ({ ...previous, [key]: value }));

  async function save(next: "forward" | "back" | "review") {
    if (!section || !schema.data) return;
    if (next === "back") {
      setSectionIndex((current) => Math.max(current - 1, 0));
      return;
    }
    const unanswered = questions
      .filter(
        (question) => question.isRequired && !hasAnswer(answers[question.key]),
      )
      .map((question) => question.key);
    if (unanswered.length) {
      setMissing(unanswered);
      setError("Complete the required questions before continuing.");
      return;
    }
    setSaving(true);
    setError(null);
    setMissing([]);
    try {
      const result = await publicApi.saveInsuranceAssessmentAnswers(
        token,
        assessmentId,
        {
          sectionKey: section.key,
          version: schema.data.assessment.version,
          answers: questions
            .filter((question) => hasAnswer(answers[question.key]))
            .map((question) => ({
              questionId: question.id,
              value: normalise(question, answers[question.key]),
            })),
        },
      );
      setSavedAt(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: ["insurance-assessment-schema", assessmentId],
      });
      if (next === "forward")
        setSectionIndex((current) =>
          Math.min(current + 1, sections.length - 1),
        );
      if (next === "review")
        router.push(`/insurance/needs/${assessmentId}/review`);
      if (
        result.missingRequiredQuestions.length === 0 &&
        next === "forward" &&
        sectionIndex === sections.length - 1
      )
        router.push(`/insurance/needs/${assessmentId}/review`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not save your answers. Your entered values are still on this device.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!token)
    return (
      <PageContainer>
        <ErrorState
          title="Sign in to continue"
          detail="Your insurance assessment is private to your Setu account."
        />
      </PageContainer>
    );
  if (schema.isLoading || detail.isLoading)
    return (
      <PageContainer>
        <LoadingState label="Preparing your private assessment" />
      </PageContainer>
    );
  if (schema.error || detail.error || !section)
    return (
      <PageContainer>
        <ErrorState
          title="Assessment unavailable"
          detail="It may be unavailable, expired, or no longer editable."
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <main className="mx-auto max-w-6xl py-8 sm:py-12">
        <header className="mb-8 rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/60 to-sky-50/50 p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-violet-700">
                Setu Insurance ·{" "}
                {schema.data?.assessment.policyType?.name ?? "Assessment"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Tell us what matters to you
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Your progress is saved as you continue. We only use this
                information for the insurance flow you approve.
              </p>
            </div>
            <Link
              className="text-sm font-medium text-violet-700 hover:underline"
              href="/account/insurance"
            >
              Save and return later
            </Link>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Progress</span>
              <span aria-live="polite">{percent}% complete</span>
            </div>
            <div className="setu-progress mt-2">
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="hidden rounded-2xl border bg-white p-4 lg:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Your progress
            </p>
            <ol className="mt-4 space-y-3">
              {sections.map((item, index) => (
                <li
                  className={
                    index === sectionIndex
                      ? "font-semibold text-violet-800"
                      : index < sectionIndex
                        ? "text-emerald-700"
                        : "text-slate-500"
                  }
                  key={item.id}
                >
                  {index < sectionIndex ? "✓" : index + 1}. {item.title}
                </li>
              ))}
            </ol>
          </aside>
          <section
            aria-labelledby="assessment-section-title"
            className="min-w-0"
          >
            <Card className="space-y-6">
              <div>
                <p className="text-sm font-medium text-violet-700">
                  Step {sectionIndex + 1} of {sections.length}
                </p>
                <h2
                  id="assessment-section-title"
                  className="mt-1 text-2xl font-semibold tracking-tight"
                >
                  {section.title}
                </h2>
                {section.description ? (
                  <p className="mt-2 text-sm text-slate-600">
                    {section.description}
                  </p>
                ) : null}
              </div>
              {error ? (
                <div className="setu-alert setu-alert-danger" role="alert">
                  {error}
                </div>
              ) : null}
              <div className="space-y-6">
                {questions.map((question) => (
                  <QuestionField
                    answer={answers[question.key]}
                    error={missing.includes(question.key)}
                    key={question.id}
                    onChange={(value) => update(question.key, value)}
                    question={question}
                  />
                ))}
              </div>
            </Card>
            <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button
                disabled={saving || sectionIndex === 0}
                onClick={() => void save("back")}
                variant="outline"
              >
                Back
              </Button>
              <p aria-live="polite" className="text-xs text-slate-500">
                {saving
                  ? "Saving your answers…"
                  : savedAt
                    ? `Saved at ${savedAt}`
                    : "Your answers stay private."}
              </p>
              <Button
                loading={saving}
                onClick={() =>
                  void save(
                    sectionIndex === sections.length - 1 ? "review" : "forward",
                  )
                }
              >
                {sectionIndex === sections.length - 1
                  ? "Review your answers"
                  : "Save and continue"}
              </Button>
            </footer>
          </section>
        </div>
      </main>
    </PageContainer>
  );
}

function QuestionField({
  question,
  answer,
  error,
  onChange,
}: {
  question: InsuranceQuestion;
  answer: unknown;
  error: boolean;
  onChange: (value: unknown) => void;
}) {
  const id = `insurance-question-${question.id}`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const common = {
    "aria-describedby": [
      question.description ? descriptionId : "",
      error ? errorId : "",
    ]
      .filter(Boolean)
      .join(" "),
    id,
  };
  return (
    <fieldset className="space-y-3">
      <legend className="font-medium text-slate-900">
        {question.label}
        {question.isRequired ? (
          <span aria-hidden="true" className="ml-1 text-rose-700">
            *
          </span>
        ) : null}
      </legend>
      {question.description ? (
        <p className="text-sm text-slate-600" id={descriptionId}>
          {question.description}
        </p>
      ) : null}
      {question.fieldType === "BOOLEAN" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            [true, "Yes"],
            [false, "No"],
          ].map(([value, label]) => (
            <button
              aria-pressed={answer === value}
              className={
                answer === value
                  ? "rounded-xl border-2 border-violet-600 bg-violet-50 p-4 text-left font-medium text-violet-900"
                  : "rounded-xl border border-slate-200 bg-white p-4 text-left font-medium hover:border-violet-300"
              }
              key={String(value)}
              onClick={() => onChange(value)}
              type="button"
            >
              {answer === value ? "✓ " : ""}
              {label}
            </button>
          ))}
        </div>
      ) : question.fieldType === "SINGLE_SELECT" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <button
              aria-pressed={answer === option.value}
              className={
                answer === option.value
                  ? "rounded-xl border-2 border-violet-600 bg-violet-50 p-4 text-left font-medium text-violet-900"
                  : "rounded-xl border border-slate-200 bg-white p-4 text-left font-medium hover:border-violet-300"
              }
              key={option.id}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {answer === option.value ? "✓ " : ""}
              {option.label}
            </button>
          ))}
        </div>
      ) : question.fieldType === "MULTI_SELECT" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => {
            const selectedValues = Array.isArray(answer)
              ? answer.filter(
                  (item): item is string => typeof item === "string",
                )
              : [];
            const selected = selectedValues.includes(option.value);
            return (
              <button
                aria-pressed={selected}
                className={
                  selected
                    ? "rounded-xl border-2 border-violet-600 bg-violet-50 p-4 text-left font-medium text-violet-900"
                    : "rounded-xl border border-slate-200 bg-white p-4 text-left font-medium hover:border-violet-300"
                }
                key={option.id}
                onClick={() =>
                  onChange(
                    selected
                      ? selectedValues.filter((item) => item !== option.value)
                      : [...selectedValues, option.value],
                  )
                }
                type="button"
              >
                {selected ? "✓ " : ""}
                {option.label}
              </button>
            );
          })}
        </div>
      ) : question.fieldType === "TEXTAREA" ? (
        <textarea
          className="setu-input setu-textarea"
          onChange={(event) => onChange(event.target.value)}
          value={typeof answer === "string" ? answer : ""}
          {...common}
        />
      ) : (
        <input
          className="setu-input"
          onChange={(event) => onChange(event.target.value)}
          type={
            isNumeric(question)
              ? "number"
              : question.fieldType === "EMAIL"
                ? "email"
                : question.fieldType === "DATE"
                  ? "date"
                  : "text"
          }
          value={
            typeof answer === "string" || typeof answer === "number"
              ? answer
              : ""
          }
          {...common}
        />
      )}
      {error ? (
        <p className="setu-field-error" id={errorId} role="alert">
          This answer is required before you continue.
        </p>
      ) : null}
    </fieldset>
  );
}
