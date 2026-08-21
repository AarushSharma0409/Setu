import { PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DiscoveryError } from "../../../components/discovery-error";
import { Pagination } from "../../../components/pagination";
import { ProductBasket } from "../../../components/product-basket";
import { productBasketForCategory } from "../../../components/product-basket-data";
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
    const productBasket = productBasketForCategory(categorySlug);
    return (
      <PageContainer className="setu-directory-detail-page">
        <section className="setu-directory-detail-hero">
          <p className="setu-eyebrow">Setu provider directory</p>
          <h1>{result.category.name}</h1>
          <p>
            Browse approved professionals and businesses in this category. Send
            an inquiry directly to the provider that fits your needs.
          </p>
          {productBasket ? <ProductBasket {...productBasket} /> : null}
          <Link className="setu-directory-detail-back" href="/categories">
            ← All categories
          </Link>
        </section>
        <section
          className="setu-directory-results"
          aria-labelledby="providers-title"
        >
          <div className="setu-directory-results-head">
            <div>
              <p className="setu-eyebrow">Available providers</p>
              <h2 id="providers-title">
                Explore {result.category.name.toLowerCase()}
              </h2>
            </div>
            <span>{result.pagination.totalItems} listed</span>
          </div>
          {result.items.length === 0 ? (
            <div className="setu-directory-empty-state">
              <span aria-hidden="true">⌁</span>
              <div>
                <p className="setu-eyebrow">Directory update</p>
                <h3>Providers are being reviewed.</h3>
                <p>
                  We do not have an approved{" "}
                  {result.category.name.toLowerCase()} provider to show yet.
                  Check back soon, or register your business to join Setu.
                </p>
              </div>
              <Link href="/vendor/onboarding">Become a provider →</Link>
            </div>
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
        </section>
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
