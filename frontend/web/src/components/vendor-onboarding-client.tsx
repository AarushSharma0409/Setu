"use client";

import {
  VendorDocumentType,
  VendorStatus,
  type CategorySummary,
  type CitySummary,
  type VendorProfileSummary,
} from "@setu/types";
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageContainer,
  Progress,
  StatusBadge,
} from "@setu/ui";
import Link from "next/link";
import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { z } from "zod";

import { publicApi } from "../lib/api-client";

type OnboardingStep =
  | "start"
  | "business"
  | "categories"
  | "service-areas"
  | "documents"
  | "review"
  | "status";

const accessTokenKey = "setu_public_access_token";
const indianMobilePattern = /^(?:\+91)?[6-9]\d{9}$/;

function normalizeIndianMobile(value: string) {
  const compact = value.replace(/[^\d+]/g, "");

  if (/^91[6-9]\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  if (/^0[6-9]\d{9}$/.test(compact)) {
    return compact.slice(1);
  }

  return compact;
}

const businessSchema = z
  .object({
    businessName: z.string().trim().min(2, "Business name is required"),
    legalName: z.string().trim().optional(),
    description: z
      .string()
      .trim()
      .min(20, "Add a short description of at least 20 characters"),
    contactEmail: z.string().trim().email().optional().or(z.literal("")),
    contactPhone: z
      .string()
      .trim()
      .transform(normalizeIndianMobile)
      .refine(
        (value) => value === "" || indianMobilePattern.test(value),
        "Enter a valid 10-digit Indian mobile number",
      ),
    websiteUrl: z.string().trim().url().optional().or(z.literal("")),
    addressLine1: z.string().trim().min(5, "Address line 1 is required"),
    addressLine2: z.string().trim().optional(),
    postalCode: z.string().trim().min(4, "Postal code is required"),
  })
  .refine((data) => Boolean(data.contactEmail || data.contactPhone), {
    message: "Add a business contact email or mobile number",
    path: ["contactEmail"],
  });

export function VendorOnboardingClient({ step }: { step: OnboardingStep }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorProfileSummary | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [cities, setCities] = useState<CitySummary[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [primaryCityId, setPrimaryCityId] = useState<string>("");
  const [documentType, setDocumentType] = useState<VendorDocumentType>(
    VendorDocumentType.GST_CERTIFICATE,
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const submitted = vendor?.status && vendor.status !== VendorStatus.DRAFT;

  useEffect(() => {
    const token = sessionStorage.getItem(accessTokenKey);
    setAccessToken(token);

    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [categoryResult, cityResult] = await Promise.all([
          publicApi.categories(),
          publicApi.cities(),
        ]);
        setCategories(categoryResult.categories);
        setCities(cityResult.cities);

        try {
          const vendorResult = await publicApi.vendorMe(token);
          setVendor(vendorResult.vendor);
          syncSelections(vendorResult.vendor);
        } catch {
          if (step !== "start") {
            throw new Error(
              "Start vendor onboarding before opening this step.",
            );
          }
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load onboarding",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [step]);

  function syncSelections(nextVendor: VendorProfileSummary) {
    setSelectedCategoryIds(
      nextVendor.categories.map((category) => category.id),
    );
    setSelectedCityIds(nextVendor.serviceAreas.map((city) => city.id));
    setPrimaryCityId(
      nextVendor.primaryCityId ?? nextVendor.serviceAreas[0]?.id ?? "",
    );
  }

  async function run(action: () => Promise<VendorProfileSummary | void>) {
    setSaving(true);
    setError(null);

    try {
      const nextVendor = await action();

      if (nextVendor) {
        setVendor(nextVendor);
        syncSelections(nextVendor);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed");
    } finally {
      setSaving(false);
    }
  }

  const currentStep = useMemo(
    () => onboardingSteps.find((item) => item.key === step),
    [step],
  );
  const currentStepIndex = onboardingSteps.findIndex(
    (item) => item.key === step,
  );
  const progress = vendor
    ? Math.round(((currentStepIndex + 1) / (onboardingSteps.length - 1)) * 100)
    : 0;

  if (loading) {
    return (
      <PageContainer>
        <LoadingState label="Loading vendor onboarding" />
      </PageContainer>
    );
  }

  if (!accessToken) {
    return (
      <PageContainer>
        <Card className="mx-auto max-w-xl">
          <h1 className="text-2xl font-semibold">
            Sign in to onboard as a vendor
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in or create an account first, then return to vendor
            onboarding.
          </p>
          <Link href="/auth?intent=signup" className="mt-5 inline-flex">
            <Button>Create an account</Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="setu-vendor-workspace">
      <header className="setu-vendor-workspace-hero">
        <div className="setu-vendor-workspace-copy">
          <p className="setu-eyebrow">Partner with Setu</p>
          <h1>{currentStep?.title ?? "Vendor workspace"}</h1>
          <p>
            Complete your business profile in a few focused steps. Save your
            work at any time and return when you are ready.
          </p>
        </div>
        <div className="setu-vendor-workspace-summary">
          <div className="setu-vendor-summary-topline">
            <span>Application</span>
            {vendor ? (
              <StatusBadge status={vendor.status} />
            ) : (
              <span>Not started</span>
            )}
          </div>
          <strong>{vendor?.businessName ?? "Your business profile"}</strong>
          <Progress label="Application progress" value={progress} />
          <p>
            {vendor?.status === VendorStatus.PENDING_REVIEW
              ? "Your application is with our verification team."
              : `${Math.max(currentStepIndex, 0) + 1} of ${onboardingSteps.length - 1} steps in progress`}
          </p>
        </div>
      </header>

      <StepNav activeStep={step} currentStepIndex={currentStepIndex} />

      {error ? <ErrorState title="Onboarding issue" detail={error} /> : null}

      {step === "start" ? (
        <StartStep
          disabled={saving}
          vendor={vendor}
          onStart={() => {
            void run(async () => {
              const result = await publicApi.startVendorOnboarding(accessToken);
              window.location.assign("/vendor/onboarding/business");
              return result.vendor;
            });
          }}
        />
      ) : null}

      {step === "business" && vendor ? (
        <BusinessStep
          disabled={saving || Boolean(submitted)}
          vendor={vendor}
          onSubmit={(input, continueToNext) => {
            void run(async () => {
              const result = await publicApi.updateVendorProfile(
                accessToken,
                input,
              );
              if (continueToNext) {
                window.location.assign("/vendor/onboarding/categories");
              }
              return result.vendor;
            });
          }}
        />
      ) : null}

      {step === "categories" && vendor ? (
        <CategoriesStep
          categories={categories}
          disabled={saving || Boolean(submitted)}
          selectedCategoryIds={selectedCategoryIds}
          setSelectedCategoryIds={setSelectedCategoryIds}
          onSave={(continueToNext) => {
            void run(async () => {
              const result = await publicApi.replaceVendorCategories(
                accessToken,
                selectedCategoryIds,
              );
              if (continueToNext) {
                window.location.assign("/vendor/onboarding/service-areas");
              }
              return result.vendor;
            });
          }}
        />
      ) : null}

      {step === "service-areas" && vendor ? (
        <ServiceAreasStep
          cities={cities}
          disabled={saving || Boolean(submitted)}
          primaryCityId={primaryCityId}
          selectedCityIds={selectedCityIds}
          setPrimaryCityId={setPrimaryCityId}
          setSelectedCityIds={setSelectedCityIds}
          onSave={(continueToNext) => {
            void run(async () => {
              const result = await publicApi.replaceVendorServiceAreas(
                accessToken,
                selectedCityIds,
                primaryCityId,
              );
              if (continueToNext) {
                window.location.assign("/vendor/onboarding/documents");
              }
              return result.vendor;
            });
          }}
        />
      ) : null}

      {step === "documents" && vendor ? (
        <DocumentsStep
          disabled={saving || Boolean(submitted)}
          documentType={documentType}
          file={file}
          setDocumentType={setDocumentType}
          setFile={setFile}
          vendor={vendor}
          onContinue={() => window.location.assign("/vendor/onboarding/review")}
          onDelete={(documentId) => {
            void run(async () => {
              await publicApi.deleteVendorDocument(accessToken, documentId);
              const result = await publicApi.vendorMe(accessToken);
              return result.vendor;
            });
          }}
          onUpload={() => {
            void run(async () => {
              if (!file) {
                throw new Error("Choose a document file first.");
              }

              const result = await publicApi.uploadVendorDocument(
                accessToken,
                documentType,
                file,
              );
              setFile(null);
              return result.vendor;
            });
          }}
        />
      ) : null}

      {step === "review" && vendor ? (
        <ReviewStep
          disabled={saving}
          vendor={vendor}
          onSubmit={() => {
            void run(async () => {
              const result = await publicApi.submitVendor(accessToken);
              window.location.assign("/vendor/status");
              return result.vendor;
            });
          }}
        />
      ) : null}

      {step === "status" && vendor ? <StatusStep vendor={vendor} /> : null}
    </PageContainer>
  );
}

function StepNav({
  activeStep,
  currentStepIndex,
}: {
  activeStep: OnboardingStep;
  currentStepIndex: number;
}) {
  return (
    <nav aria-label="Vendor onboarding steps" className="setu-vendor-step-nav">
      <ol>
        {onboardingSteps.map((item, index) => (
          <li key={item.key}>
            <Link
              className={[
                "setu-vendor-step-link",
                item.key === activeStep
                  ? "is-active"
                  : index < currentStepIndex
                    ? "is-complete"
                    : "",
              ].join(" ")}
              href={item.href}
              aria-current={item.key === activeStep ? "step" : undefined}
            >
              <span className="setu-vendor-step-number">
                {index < currentStepIndex ? "✓" : index + 1}
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StartStep({
  disabled,
  onStart,
  vendor,
}: {
  disabled: boolean;
  onStart: () => void;
  vendor: VendorProfileSummary | null;
}) {
  return (
    <Card className="setu-vendor-panel setu-vendor-start-panel">
      <div className="setu-vendor-panel-icon" aria-hidden="true">
        ✦
      </div>
      <p className="setu-vendor-panel-kicker">Step 1 · Get started</p>
      <h2 className="text-xl font-semibold">
        Create or resume your vendor profile
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Starting onboarding creates a secure owner-only vendor profile linked to
        your account.
      </p>
      <div className="setu-vendor-actions">
        <Button disabled={disabled} onClick={onStart}>
          {vendor ? "Refresh profile" : "Start onboarding"}
        </Button>
        {vendor ? (
          <Link href="/vendor/onboarding/business">
            <Button type="button" variant="secondary">
              Continue to business details
            </Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

function BusinessStep({
  disabled,
  onSubmit,
  vendor,
}: {
  disabled: boolean;
  onSubmit: (input: Record<string, string>, continueToNext: boolean) => void;
  vendor: VendorProfileSummary;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  function save(form: HTMLFormElement, continueToNext: boolean) {
    const data = Object.fromEntries(new FormData(form));
    const parsed = businessSchema.safeParse(data);

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the form fields.");
      return;
    }

    setFormError(null);
    onSubmit(parsed.data, continueToNext);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(event.currentTarget, false);
  }

  return (
    <Card className="setu-vendor-panel">
      <div className="setu-vendor-panel-head">
        <div>
          <p className="setu-vendor-panel-kicker">Step 2 · Business details</p>
          <h2>Tell customers who you are</h2>
          <p>Your details stay private until your application is approved.</p>
        </div>
        <span className="setu-vendor-panel-count">Required details</span>
      </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <Field
          name="businessName"
          label="Business name"
          defaultValue={vendor.businessName}
          disabled={disabled}
        />
        <Field
          name="legalName"
          label="Legal name"
          defaultValue={vendor.legalName}
          disabled={disabled}
        />
        <Field
          name="contactEmail"
          label="Contact email"
          defaultValue={vendor.contactEmail}
          disabled={disabled}
        />
        <Field
          name="contactPhone"
          label="Contact phone"
          defaultValue={vendor.contactPhone}
          disabled={disabled}
          inputMode="tel"
          placeholder="9876543210 or +91 98765 43210"
          type="tel"
        />
        <Field
          name="websiteUrl"
          label="Website URL"
          defaultValue={vendor.websiteUrl}
          disabled={disabled}
          placeholder="https://your-business.example"
          type="url"
        />
        <Field
          name="postalCode"
          label="Postal code"
          defaultValue={vendor.postalCode}
          disabled={disabled}
        />
        <Field
          name="addressLine1"
          label="Address line 1"
          defaultValue={vendor.addressLine1}
          disabled={disabled}
        />
        <Field
          name="addressLine2"
          label="Address line 2"
          defaultValue={vendor.addressLine2}
          disabled={disabled}
        />
        <label className="md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Description
          </span>
          <textarea
            className="mt-1 min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            defaultValue={vendor.description ?? ""}
            disabled={disabled}
            name="description"
          />
        </label>
        {formError ? (
          <div className="md:col-span-2">
            <ErrorState title="Form issue" detail={formError} />
          </div>
        ) : null}
        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-3">
            <Button disabled={disabled} type="submit">
              Save business details
            </Button>
            <Button
              disabled={disabled}
              onClick={(event) => {
                if (event.currentTarget.form) {
                  save(event.currentTarget.form, true);
                }
              }}
              type="button"
              variant="secondary"
            >
              Save and continue
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Field({
  defaultValue,
  disabled,
  inputMode,
  label,
  name,
  placeholder,
  type,
}: {
  defaultValue?: string | null;
  disabled: boolean;
  inputMode?: "email" | "tel" | "text" | "url";
  label: string;
  name: string;
  placeholder?: string;
  type?: "email" | "tel" | "text" | "url";
}) {
  return (
    <label className="setu-vendor-field">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Input
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        inputMode={inputMode}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function CategoriesStep({
  categories,
  disabled,
  onSave,
  selectedCategoryIds,
  setSelectedCategoryIds,
}: {
  categories: CategorySummary[];
  disabled: boolean;
  onSave: (continueToNext: boolean) => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
}) {
  return (
    <Card className="setu-vendor-panel">
      <div className="setu-vendor-panel-head">
        <div>
          <p className="setu-vendor-panel-kicker">Step 3 · Categories</p>
          <h2>What services do you offer?</h2>
          <p>Select up to five categories that best describe your business.</p>
        </div>
        <span className="setu-vendor-selection-count">
          {selectedCategoryIds.length}/5 selected
        </span>
      </div>
      <ChoiceGrid
        disabled={disabled}
        items={categories.map((category) => ({
          id: category.id,
          label: category.name,
        }))}
        selectedIds={selectedCategoryIds}
        setSelectedIds={setSelectedCategoryIds}
      />
      <p className="text-sm text-slate-600">
        Choose at least one category before continuing.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={disabled || selectedCategoryIds.length === 0}
          onClick={() => onSave(false)}
        >
          Save categories
        </Button>
        <Button
          disabled={disabled || selectedCategoryIds.length === 0}
          onClick={() => onSave(true)}
          variant="secondary"
        >
          Save and continue
        </Button>
      </div>
    </Card>
  );
}

function ServiceAreasStep({
  cities,
  disabled,
  onSave,
  primaryCityId,
  selectedCityIds,
  setPrimaryCityId,
  setSelectedCityIds,
}: {
  cities: CitySummary[];
  disabled: boolean;
  onSave: (continueToNext: boolean) => void;
  primaryCityId: string;
  selectedCityIds: string[];
  setPrimaryCityId: (cityId: string) => void;
  setSelectedCityIds: (ids: string[]) => void;
}) {
  return (
    <Card className="setu-vendor-panel">
      <div className="setu-vendor-panel-head">
        <div>
          <p className="setu-vendor-panel-kicker">Step 4 · Service areas</p>
          <h2>Where do you serve customers?</h2>
          <p>Choose cities you serve, then set your primary operating city.</p>
        </div>
        <span className="setu-vendor-selection-count">
          {selectedCityIds.length} selected
        </span>
      </div>
      <ChoiceGrid
        disabled={disabled}
        items={cities.map((city) => ({
          id: city.id,
          label: `${city.name}, ${city.stateName ?? "India"}`,
        }))}
        selectedIds={selectedCityIds}
        setSelectedIds={setSelectedCityIds}
      />
      <label className="block max-w-md">
        <span className="text-sm font-medium text-slate-700">Primary city</span>
        <select
          className="mt-1 min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
          disabled={disabled}
          onChange={(event) => setPrimaryCityId(event.target.value)}
          value={primaryCityId}
        >
          <option value="">Choose primary city</option>
          {selectedCityIds.map((cityId) => {
            const city = cities.find((item) => item.id === cityId);
            return city ? (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ) : null;
          })}
        </select>
      </label>
      <p className="text-sm text-slate-600">
        Choose at least one service area and a primary city before continuing.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={disabled || selectedCityIds.length === 0 || !primaryCityId}
          onClick={() => onSave(false)}
        >
          Save service areas
        </Button>
        <Button
          disabled={disabled || selectedCityIds.length === 0 || !primaryCityId}
          onClick={() => onSave(true)}
          variant="secondary"
        >
          Save and continue
        </Button>
      </div>
    </Card>
  );
}

function ChoiceGrid({
  disabled,
  items,
  selectedIds,
  setSelectedIds,
}: {
  disabled: boolean;
  items: { id: string; label: string }[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}) {
  return (
    <div className="setu-vendor-choice-grid">
      {items.map((item) => (
        <label
          className={`setu-vendor-choice${selectedIds.includes(item.id) ? " is-selected" : ""}`}
          key={item.id}
        >
          <input
            checked={selectedIds.includes(item.id)}
            disabled={disabled}
            onChange={(event) => {
              setSelectedIds(
                event.target.checked
                  ? [...selectedIds, item.id]
                  : selectedIds.filter((id) => id !== item.id),
              );
            }}
            type="checkbox"
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}

function DocumentsStep({
  disabled,
  documentType,
  file,
  onDelete,
  onUpload,
  onContinue,
  setDocumentType,
  setFile,
  vendor,
}: {
  disabled: boolean;
  documentType: VendorDocumentType;
  file: File | null;
  onDelete: (documentId: string) => void;
  onUpload: () => void;
  onContinue: () => void;
  setDocumentType: (type: VendorDocumentType) => void;
  setFile: (file: File | null) => void;
  vendor: VendorProfileSummary;
}) {
  return (
    <Card className="setu-vendor-panel">
      <div className="setu-vendor-panel-head">
        <div>
          <p className="setu-vendor-panel-kicker">Step 5 · Documents</p>
          <h2>Upload a verification document</h2>
          <p>PDF, JPG, or PNG files up to 10 MB are accepted.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[240px_1fr_auto]">
        <select
          className="min-h-10 rounded-md border border-slate-200 px-3 text-sm"
          disabled={disabled}
          onChange={(event) =>
            setDocumentType(event.target.value as VendorDocumentType)
          }
          value={documentType}
        >
          {Object.values(VendorDocumentType).map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <Input
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={disabled}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          type="file"
        />
        <Button disabled={disabled || !file} onClick={onUpload}>
          Upload
        </Button>
      </div>
      <ul className="space-y-2">
        {vendor.documents.map((document) => (
          <li
            className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"
            key={document.id}
          >
            <span>
              {document.originalFileName} · {document.type.replaceAll("_", " ")}{" "}
              · {document.status}
            </span>
            <Button
              disabled={disabled}
              onClick={() => onDelete(document.id)}
              type="button"
              variant="ghost"
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-200 pt-5">
        <p className="mb-3 text-sm text-slate-600">
          Upload at least one verification document before continuing.
        </p>
        <Button
          disabled={disabled || vendor.documents.length === 0}
          onClick={onContinue}
          variant="secondary"
        >
          Continue to review
        </Button>
      </div>
    </Card>
  );
}

function ReviewStep({
  disabled,
  onSubmit,
  vendor,
}: {
  disabled: boolean;
  onSubmit: () => void;
  vendor: VendorProfileSummary;
}) {
  const ready = vendor.missingRequirements.length === 0;

  return (
    <Card className="setu-vendor-panel setu-vendor-review-panel">
      <p className="setu-vendor-panel-kicker">Step 6 · Review</p>
      <h2 className="text-xl font-semibold">
        {vendor.businessName ?? "Vendor profile"}
      </h2>
      {ready ? (
        <p className="text-sm text-emerald-700">
          All required onboarding sections are complete.
        </p>
      ) : (
        <ErrorState
          title="Complete these items before submitting"
          detail={
            <ul className="list-disc pl-5">
              {vendor.missingRequirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          }
        />
      )}
      <Button
        disabled={disabled || !ready || vendor.status !== VendorStatus.DRAFT}
        onClick={onSubmit}
      >
        Submit application for verification
      </Button>
    </Card>
  );
}

function StatusStep({ vendor }: { vendor: VendorProfileSummary }) {
  const isPendingReview = vendor.status === VendorStatus.PENDING_REVIEW;

  return (
    <Card className="setu-vendor-panel setu-vendor-status-panel">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          {isPendingReview ? "Application received" : "Application status"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {isPendingReview
            ? "Your details are now in the verification queue."
            : `Current status: ${vendor.status.replaceAll("_", " ")}`}
        </h2>
        {isPendingReview ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
            Our operations team will review your business details and documents.
            We aim to complete reviews of complete applications within 24 hours.
            You will see the outcome here and in Vendor notifications.
          </p>
        ) : null}
      </div>
      {vendor.submittedAt ? (
        <p className="text-sm text-slate-500">
          Submitted at {new Date(vendor.submittedAt).toLocaleString()}
        </p>
      ) : null}
      <Link className="inline-flex" href="/vendor/notifications">
        <Button variant="secondary">View vendor notifications</Button>
      </Link>
    </Card>
  );
}

const onboardingSteps: {
  key: OnboardingStep;
  label: string;
  title: string;
  href: string;
}[] = [
  {
    key: "start",
    label: "Start",
    title: "Start vendor onboarding",
    href: "/vendor/onboarding",
  },
  {
    key: "business",
    label: "Business",
    title: "Business profile",
    href: "/vendor/onboarding/business",
  },
  {
    key: "categories",
    label: "Categories",
    title: "Categories",
    href: "/vendor/onboarding/categories",
  },
  {
    key: "service-areas",
    label: "Service areas",
    title: "Service areas",
    href: "/vendor/onboarding/service-areas",
  },
  {
    key: "documents",
    label: "Documents",
    title: "Documents",
    href: "/vendor/onboarding/documents",
  },
  {
    key: "review",
    label: "Review",
    title: "Review and submit",
    href: "/vendor/onboarding/review",
  },
  {
    key: "status",
    label: "Status",
    title: "Vendor onboarding status",
    href: "/vendor/status",
  },
];
