import { PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "../../../../../components/breadcrumbs";
import { DiscoveryError } from "../../../../../components/discovery-error";
import { Pagination } from "../../../../../components/pagination";
import { VendorCard } from "../../../../../components/vendor-card";
import {
  DiscoveryNotFoundError,
  discoveryApi,
} from "../../../../../lib/discovery-api";

export const dynamic = "force-dynamic";
interface Props {
  params: Promise<{
    categorySlug: string;
    stateSlug: string;
    citySlug: string;
  }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { categorySlug, stateSlug, citySlug } = await params;
    const [categoryResult, cityResult] = await Promise.all([
      discoveryApi.category(categorySlug),
      discoveryApi.city(stateSlug, citySlug),
    ]);
    return {
      title: `${categoryResult.category.name} providers in ${cityResult.city.name} | Setu`,
      description: `Explore approved ${categoryResult.category.name.toLowerCase()} providers serving ${cityResult.city.name}.`,
      alternates: {
        canonical: `/services/${categorySlug}/${stateSlug}/${citySlug}`,
      },
    };
  } catch {
    return { title: "Discovery page not found | Setu" };
  }
}

export default async function CombinedPage({ params, searchParams }: Props) {
  const { categorySlug, stateSlug, citySlug } = await params;
  const page = Number((await searchParams).page ?? "1");
  try {
    const [categoryResult, cityResult, results] = await Promise.all([
      discoveryApi.category(categorySlug),
      discoveryApi.city(stateSlug, citySlug),
      discoveryApi.vendors({
        category: categorySlug,
        city: citySlug,
        state: stateSlug,
        page,
      }),
    ]);
    return (
      <PageContainer>
        <Breadcrumbs
          items={[
            {
              label: categoryResult.category.name,
              href: `/categories/${categorySlug}`,
            },
            { label: cityResult.city.name },
          ]}
        />
        <h1 className="text-3xl font-semibold">
          {categoryResult.category.name} providers in {cityResult.city.name}
        </h1>
        <p className="mt-3 text-slate-600">
          Approved providers serving this category and city.
        </p>
        {results.items.length === 0 ? (
          <p className="mt-8 rounded border border-slate-200 bg-white p-6 text-slate-600">
            No approved vendors are currently available for this category and
            city.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.items.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
        <Pagination
          pagination={results.pagination}
          pathname={`/services/${categorySlug}/${stateSlug}/${citySlug}`}
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
                  name: categoryResult.category.name,
                  item: `/categories/${categorySlug}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: cityResult.city.name,
                },
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
