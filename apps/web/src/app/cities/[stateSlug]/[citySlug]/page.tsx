import { PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "../../../../components/breadcrumbs";
import { DiscoveryError } from "../../../../components/discovery-error";
import { Pagination } from "../../../../components/pagination";
import { VendorCard } from "../../../../components/vendor-card";
import {
  DiscoveryNotFoundError,
  discoveryApi,
} from "../../../../lib/discovery-api";

export const dynamic = "force-dynamic";
interface Props {
  params: Promise<{ stateSlug: string; citySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { stateSlug, citySlug } = await params;
    const { city } = await discoveryApi.city(stateSlug, citySlug);
    return {
      title: `Service providers in ${city.name}, ${city.stateName} | Setu`,
      description: `Explore approved service providers serving ${city.name}, ${city.stateName}.`,
      alternates: { canonical: `/cities/${stateSlug}/${citySlug}` },
    };
  } catch {
    return { title: "City not found | Setu" };
  }
}

export default async function CityPage({ params, searchParams }: Props) {
  const { stateSlug, citySlug } = await params;
  const page = Number((await searchParams).page ?? "1");
  try {
    const result = await discoveryApi.city(stateSlug, citySlug, { page });
    return (
      <PageContainer>
        <Breadcrumbs
          items={[
            { label: "Cities", href: "/cities" },
            {
              label: result.city.stateName,
              href: `/cities/${stateSlug}/${citySlug}`,
            },
            { label: result.city.name },
          ]}
        />
        <h1 className="text-3xl font-semibold">
          Service providers in {result.city.name}
        </h1>
        <p className="mt-3 text-slate-600">
          Approved providers serving {result.city.name}, {result.city.stateName}
          .
        </p>
        {result.items.length === 0 ? (
          <p className="mt-8 rounded border border-slate-200 bg-white p-6 text-slate-600">
            No approved vendors currently serve this city.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
        <Pagination
          pagination={result.pagination}
          pathname={`/cities/${stateSlug}/${citySlug}`}
        />
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
                  name: "Cities",
                  item: "/cities",
                },
                { "@type": "ListItem", position: 3, name: result.city.name },
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
