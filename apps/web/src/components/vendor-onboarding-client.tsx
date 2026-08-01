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

const businessSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  legalName: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .min(20, "Add a short description of at least 20 characters"),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().min(10).optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  addressLine1: z.string().trim().min(5, "Address line 1 is required"),
  addressLine2: z.string().trim().optional(),
  postalCode: z.string().trim().min(4, "Postal code is required"),
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
            Sprint 2 uses the Sprint 1 development login. Sign in first, then
            return to vendor onboarding.
          </p>
          <Link href="/dev-auth" className="mt-5 inline-flex">
            <Button>Open development login</Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <p className="setu-eyebrow">Vendor workspace</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {currentStep?.title ?? "Vendor onboarding"}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          This is a save-and-resume onboarding foundation. Submitted profiles
          move to pending review; admin review is intentionally not built in
          this sprint.
        </p>
      </header>

      <StepNav activeStep={step} />
      {vendor ? (
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={vendor.status} />
          <Progress
            label="Application progress"
            value={Math.round(
              ((onboardingSteps.findIndex((item) => item.key === step) + 1) /
                onboardingSteps.length) *
                100,
            )}
          />
        </div>
      ) : null}

      {error ? <ErrorState title="Onboarding issue" detail={error} /> : null}

      {step === "start" ? (
        <StartStep
          disabled={saving}
          vendor={vendor}
          onStart={() => {
            void run(async () => {
              const result = await publicApi.startVendorOnboarding(accessToken);
              return result.vendor;
            });
          }}
        />
      ) : null}

      {step === "business" && vendor ? (
        <BusinessStep
          disabled={saving || Boolean(submitted)}
          vendor={vendor}
          onSubmit={(input) => {
            void run(async () => {
              const result = await publicApi.updateVendorProfile(
                accessToken,
                input,
              );
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
          onSave={() => {
            void run(async () => {
              const result = await publicApi.replaceVendorCategories(
                accessToken,
                selectedCategoryIds,
              );
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
          onSave={() => {
            void run(async () => {
              const result = await publicApi.replaceVendorServiceAreas(
                accessToken,
                selectedCityIds,
                primaryCityId,
              );
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
              return result.vendor;
            });
          }}
        />
      ) : null}

      {step === "status" && vendor ? <StatusStep vendor={vendor} /> : null}
    </PageContainer>
  );
}

function StepNav({ activeStep }: { activeStep: OnboardingStep }) {
  return (
    <nav aria-label="Vendor onboarding steps">
      <ol className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {onboardingSteps.map((item, index) => (
          <li key={item.key}>
            <Link
              className={[
                "rounded-full px-3 py-1 text-sm",
                item.key === activeStep
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
              href={item.href}
              aria-current={item.key === activeStep ? "step" : undefined}
            >
              <span className="mr-1 text-xs opacity-70">{index + 1}</span>
              {item.label}
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
    <Card>
      <h2 className="text-xl font-semibold">
        Create or resume your vendor profile
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Starting onboarding safely upgrades your development public user into a
        vendor account and creates one owner-only vendor profile.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={disabled} onClick={onStart}>
          {vendor ? "Refresh profile" : "Start onboarding"}
        </Button>
        {vendor ? (
          <Link href="/vendor/onboarding/business">
            <Button type="button" variant="secondary">
              Continue
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
  onSubmit: (input: Record<string, string>) => void;
  vendor: VendorProfileSummary;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = businessSchema.safeParse(data);

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the form fields.");
      return;
    }

    setFormError(null);
    onSubmit(parsed.data);
  }

  return (
    <Card>
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
        />
        <Field
          name="websiteUrl"
          label="Website URL"
          defaultValue={vendor.websiteUrl}
          disabled={disabled}
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
          <Button disabled={disabled} type="submit">
            Save business details
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  defaultValue,
  disabled,
  label,
  name,
}: {
  defaultValue?: string | null;
  disabled: boolean;
  label: string;
  name: string;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Input
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        name={name}
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
  onSave: () => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
}) {
  return (
    <Card className="space-y-4">
      <ChoiceGrid
        disabled={disabled}
        items={categories.map((category) => ({
          id: category.id,
          label: category.name,
        }))}
        selectedIds={selectedCategoryIds}
        setSelectedIds={setSelectedCategoryIds}
      />
      <Button disabled={disabled} onClick={onSave}>
        Save categories
      </Button>
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
  onSave: () => void;
  primaryCityId: string;
  selectedCityIds: string[];
  setPrimaryCityId: (cityId: string) => void;
  setSelectedCityIds: (ids: string[]) => void;
}) {
  return (
    <Card className="space-y-4">
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
      <Button disabled={disabled} onClick={onSave}>
        Save service areas
      </Button>
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
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <label
          className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm"
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
  setDocumentType,
  setFile,
  vendor,
}: {
  disabled: boolean;
  documentType: VendorDocumentType;
  file: File | null;
  onDelete: (documentId: string) => void;
  onUpload: () => void;
  setDocumentType: (type: VendorDocumentType) => void;
  setFile: (file: File | null) => void;
  vendor: VendorProfileSummary;
}) {
  return (
    <Card className="space-y-5">
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
    <Card className="space-y-4">
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
        Submit for review
      </Button>
    </Card>
  );
}

function StatusStep({ vendor }: { vendor: VendorProfileSummary }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">
        Current status: {vendor.status.replaceAll("_", " ")}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Sprint 2 stops at submission and status visibility. Admin review,
        approval, rejection, and public listing controls are planned later.
      </p>
      {vendor.submittedAt ? (
        <p className="mt-4 text-sm text-slate-500">
          Submitted at {new Date(vendor.submittedAt).toLocaleString()}
        </p>
      ) : null}
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
