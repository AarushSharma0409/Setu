import { PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
      <PageContainer className="setu-directory-detail-page">
        <section className="setu-directory-detail-hero setu-city-detail-hero">
          <p className="setu-eyebrow">Setu provider directory</p>
          <h1>Professionals near {result.city.name}</h1>
          <p>
            Browse approved local businesses serving {result.city.name},{" "}
            {result.city.stateName}. View each profile before choosing who to
            contact.
          </p>
          <div className="setu-city-detail-marker" aria-label="Selected city">
            <span aria-hidden="true">City</span>
            <div>
              <strong>{result.city.name}</strong>
              <small>{result.city.stateName}</small>
            </div>
          </div>
          <Link className="setu-directory-detail-back" href="/cities">
            All cities
          </Link>
        </section>

        <section
          className="setu-directory-results"
          aria-labelledby="providers-title"
        >
          <div className="setu-directory-results-head">
            <div>
              <p className="setu-eyebrow">Available providers</p>
              <h2 id="providers-title">Explore {result.city.name}</h2>
            </div>
            <span>{result.pagination.totalItems} listed</span>
          </div>

          {result.items.length === 0 ? (
            <div className="setu-directory-empty-state">
              <span aria-hidden="true">Soon</span>
              <div>
                <p className="setu-eyebrow">Directory update</p>
                <h3>Providers are being reviewed.</h3>
                <p>
                  We do not have an approved provider for {result.city.name}{" "}
                  to show yet. Check back soon, or register your business to
                  join Setu.
                </p>
              </div>
              <Link href="/vendor/onboarding">Become a provider</Link>
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
            pathname={`/cities/${stateSlug}/${citySlug}`}
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
                  name: "Cities",
                  item: "/cities",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: result.city.name,
                },
              ],
            }),
          }}
        />
      </PageContainer>
    );
  } catch (error) {
    if (error instanceof DiscoveryNotFoundError) {
      notFound();
    }

    return (
      <PageContainer>
        <DiscoveryError />
      </PageContainer>
    );
  }
}
