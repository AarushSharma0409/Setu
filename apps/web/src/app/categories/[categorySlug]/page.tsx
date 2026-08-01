import { PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "../../../components/breadcrumbs";
import { DiscoveryError } from "../../../components/discovery-error";
import { Pagination } from "../../../components/pagination";
import { VendorCard } from "../../../components/vendor-card";
import {
  DiscoveryNotFoundError,
  discoveryApi,
} from "../../../lib/discovery-api";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { category } = await discoveryApi.category(
      (await params).categorySlug,
    );
    return {
      title: `${category.name} service providers | Setu`,
      description:
        category.description ??
        `Explore approved ${category.name.toLowerCase()} providers on Setu.`,
      alternates: { canonical: `/categories/${category.slug}` },
    };
  } catch {
    return { title: "Category not found | Setu" };
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const page = Number((await searchParams).page ?? "1");
  try {
    const result = await discoveryApi.category(categorySlug, { page });
    return (
      <PageContainer>
        <Breadcrumbs
          items={[
            { label: "Categories", href: "/categories" },
            { label: result.category.name },
          ]}
        />
        <h1 className="text-3xl font-semibold">
          {result.category.name} service providers
        </h1>
        <p className="mt-3 text-slate-600">
          Approved providers listed in this category.
        </p>
        {result.items.length === 0 ? (
          <p className="mt-8 rounded border border-slate-200 bg-white p-6 text-slate-600">
            No approved vendors are currently available for this category.
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
          pathname={`/categories/${categorySlug}`}
          params={{ page: String(page) }}
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
                  name: "Categories",
                  item: "/categories",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: result.category.name,
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
