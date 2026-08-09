"use client";

import { Button, Card, ErrorState, Input, LoadingState } from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { adminApi } from "../lib/admin-api-client";

function accessToken() {
  return typeof window === "undefined"
    ? ""
    : (sessionStorage.getItem("setu_admin_access_token") ?? "");
}

export function InsuranceProductsWorkspace({
  productId,
  create = false,
}: {
  productId?: string;
  create?: boolean;
}) {
  const router = useRouter();
  const token = accessToken();
  const [error, setError] = useState<string | null>(null);
  const products = useQuery({
    queryKey: ["insurance-products"],
    queryFn: () => adminApi.insuranceProducts(token),
    enabled: Boolean(token) && !productId && !create,
  });
  const product = useQuery({
    queryKey: ["insurance-product", productId],
    queryFn: () => adminApi.insuranceProduct(token, productId ?? ""),
    enabled: Boolean(token && productId),
  });

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      setError(null);
      const created = await adminApi.createInsuranceProduct(token, {
        organizationId: formValue(form, "organizationId"),
        policyTypeId: formValue(form, "policyTypeId"),
        code: formValue(form, "code"),
        name: formValue(form, "name"),
        shortDescription: formValue(form, "shortDescription"),
        longDescription: formValue(form, "longDescription"),
      });
      router.push(`/insurance/products/${created.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create product",
      );
    }
  }

  if (!token)
    return (
      <ErrorState
        title="Admin session required"
        detail="Sign in again to access the private product catalogue."
      />
    );
  if (create)
    return (
      <Card className="max-w-2xl">
        <form
          className="space-y-4"
          onSubmit={(event) => void submitCreate(event)}
        >
          <h2 className="text-lg font-semibold">Create product draft</h2>
          <p className="text-sm text-slate-500">
            Use active insurer and policy-type IDs from the controlled I1
            configuration. The product remains a draft until it passes review.
          </p>
          <Input
            name="organizationId"
            aria-label="Insurer organization ID"
            placeholder="Insurer organization ID"
            required
          />
          <Input
            name="policyTypeId"
            aria-label="Policy type ID"
            placeholder="Policy type ID"
            required
          />
          <Input
            name="code"
            aria-label="Product code"
            placeholder="Product code"
            required
          />
          <Input
            name="name"
            aria-label="Product name"
            placeholder="Product name"
            required
          />
          <Input
            name="shortDescription"
            aria-label="Short description"
            placeholder="Short description"
            required
          />
          <Input
            name="longDescription"
            aria-label="Long description"
            placeholder="Long description"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit">Create draft</Button>
        </form>
      </Card>
    );
  if (productId) {
    if (product.isLoading) return <LoadingState label="Loading product" />;
    if (product.error || !product.data)
      return (
        <ErrorState
          title="Product unavailable"
          detail="This catalogue record could not be loaded."
        />
      );
    const current = product.data.currentVersion;
    return (
      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-violet-600">
                {product.data.organization.legalName} ·{" "}
                {product.data.policyType.name}
              </p>
              <h2 className="text-xl font-semibold">
                {current?.name ?? product.data.code}
              </h2>
              <p className="text-sm text-slate-500">
                {product.data.code} · {product.data.status}
              </p>
            </div>
            <Link
              className="text-sm text-violet-700"
              href="/insurance/products"
            >
              All products
            </Link>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Version history</h3>
          <div className="mt-3 space-y-2">
            {product.data.versions.map((version) => (
              <div
                className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm"
                key={version.id}
              >
                <span>
                  v{version.versionNumber} · {version.name}
                </span>
                <span>{version.status}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Catalogue editing</h3>
          <p className="mt-2 text-sm text-slate-500">
            Coverage, eligibility, sum insured, premium basis, waiting periods,
            exclusions, add-ons, deductibles, availability, and documents are
            edited on the version-scoped API. Approved versions remain
            read-only.
          </p>
        </Card>
      </div>
    );
  }
  if (products.isLoading)
    return <LoadingState label="Loading product catalogue" />;
  if (products.error)
    return (
      <ErrorState
        title="Catalogue unavailable"
        detail="Enable the product-catalogue feature only after the I1 operating model is active."
      />
    );
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/insurance/products/new">
          <Button>Create product</Button>
        </Link>
      </div>
      <div className="grid gap-3">
        {products.data?.items.map((item) => (
          <Link href={`/insurance/products/${item.id}`} key={item.id}>
            <Card className="transition hover:border-violet-300">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {item.currentVersion?.name ?? item.code}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.organization.legalName} · {item.policyType.name}
                  </p>
                </div>
                <span className="text-sm text-violet-700">{item.status}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formValue(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
