import { Card, PageContainer, StatusBadge } from "@setu/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "../../../components/breadcrumbs";
import { DiscoveryError } from "../../../components/discovery-error";
import { InquiryForm } from "../../../components/inquiry-form";
import {
  DiscoveryNotFoundError,
  discoveryApi,
} from "../../../lib/discovery-api";

export const dynamic = "force-dynamic";
interface Props {
  params: Promise<{ vendorSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { vendor } = await discoveryApi.vendor((await params).vendorSlug);
    return {
      title: `${vendor.businessName} | Verified provider on Setu`,
      description: vendor.description.slice(0, 155),
      alternates: { canonical: `/vendors/${vendor.slug}` },
    };
  } catch {
    return { title: "Vendor not found | Setu" };
  }
}

export default async function VendorPage({ params }: Props) {
  try {
    const { vendor } = await discoveryApi.vendor((await params).vendorSlug);
    return (
      <PageContainer>
        <Breadcrumbs
          items={[
            { label: "Vendors", href: "/search" },
            { label: vendor.businessName },
          ]}
        />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <p className="setu-eyebrow">Approved provider</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  {vendor.businessName}
                </h1>
              </div>
              <StatusBadge status="APPROVED" />
            </div>
            <p className="mt-3 text-slate-600">
              {vendor.primaryCity.name}, {vendor.primaryCity.stateName}
            </p>
            <Card className="mt-8">
              <h2 className="text-xl font-semibold">About this provider</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
                {vendor.description}
              </p>
            </Card>
            <h2 className="mt-10 text-xl font-semibold">Services</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {vendor.categories.map((category) => (
                <span
                  key={category.slug}
                  className="rounded bg-slate-100 px-3 py-1 text-sm"
                >
                  {category.name}
                </span>
              ))}
            </div>
            <h2 className="mt-10 text-xl font-semibold">Service areas</h2>
            <ul className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
              {vendor.serviceAreas.map((city) => (
                <li
                  key={`${city.stateCode}-${city.slug}`}
                  className="rounded border px-3 py-1"
                >
                  {city.name}, {city.stateName}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <h2 className="text-lg font-semibold">Business information</h2>
              {vendor.legalName ? (
                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">
                    Legal name:
                  </span>{" "}
                  {vendor.legalName}
                </p>
              ) : null}
              {vendor.yearEstablished ? (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">
                    Established:
                  </span>{" "}
                  {vendor.yearEstablished}
                </p>
              ) : null}
              {vendor.contactPhone ? (
                <p className="mt-4 text-sm">
                  <a
                    className="font-semibold underline"
                    href={`tel:${vendor.contactPhone}`}
                  >
                    Call provider
                  </a>
                </p>
              ) : null}
              {vendor.contactEmail ? (
                <p className="mt-2 text-sm">
                  <a
                    className="font-semibold underline"
                    href={`mailto:${vendor.contactEmail}`}
                  >
                    Email provider
                  </a>
                </p>
              ) : null}
              {vendor.websiteUrl ? (
                <p className="mt-2 text-sm">
                  <a
                    className="font-semibold underline"
                    href={vendor.websiteUrl}
                    rel="noreferrer"
                  >
                    Visit website
                  </a>
                </p>
              ) : null}
              <p className="mt-6 border-t pt-4 text-xs leading-5 text-slate-500">
                Setu verification confirms the business completed the platform
                review process. It does not guarantee service quality.
              </p>
            </Card>
            <InquiryForm
              vendorId={vendor.id}
              vendorName={vendor.businessName}
              returnPath={`/vendors/${vendor.slug}`}
            />
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Vendors",
                  item: "/search",
                },
                { "@type": "ListItem", position: 3, name: vendor.businessName },
              ],
            }),
          }}
        />
      </PageContainer>
    );
  } catch (error) {
    if (error instanceof DiscoveryNotFoundError) notFound();
    return (
      <PageContainer>
        <DiscoveryError />
      </PageContainer>
    );
  }
}
