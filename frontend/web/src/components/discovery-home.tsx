"use client";

import type {
  PublicCategory,
  PublicCity,
  PublicVendorSummary,
} from "@setu/types";
import {
  Button,
  Card,
  ErrorState,
  EmptyState,
  FeatureChip,
  Input,
  LoadingState,
  PageContainer,
  Reveal,
  Select,
} from "@setu/ui";
import Link from "next/link";
import React, { useEffect, useState, type FormEvent } from "react";

import { publicApi } from "../lib/api-client";

function CategoryGlyph({ slug }: { slug: string }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (slug.includes("home") || slug.includes("repair")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...shared} d="m3.5 10 8.5-6.5 8.5 6.5v10H14v-5.25h-4V20H3.5Z" />
      </svg>
    );
  }
  if (slug.includes("event") || slug.includes("wedding")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...shared} d="M5 20V8.25A2.25 2.25 0 0 1 7.25 6h9.5A2.25 2.25 0 0 1 19 8.25V20M3 20h18M8 3.5v5M16 3.5v5M9 13h6" />
      </svg>
    );
  }
  if (slug.includes("health") || slug.includes("wellness")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...shared} d="M12 20s-7-3.9-7-9.35C5 7.95 6.77 6 9.25 6A4.1 4.1 0 0 1 12 7.12 4.1 4.1 0 0 1 14.75 6C17.23 6 19 7.95 19 10.65 19 16.1 12 20 12 20Z" />
        <path {...shared} d="M8.25 12h2l1.1-2.1 1.45 4.15 1.05-2.05h1.9" />
      </svg>
    );
  }
  if (slug.includes("auto")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...shared} d="m5.25 16 .95-5.2A2.2 2.2 0 0 1 8.37 9h7.26a2.2 2.2 0 0 1 2.17 1.8l.95 5.2v2.5h-2.5v-1.25h-8.5v1.25h-2.5Z" />
        <path {...shared} d="M6.5 14h11M8.25 15.5h.01M15.75 15.5h.01" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path {...shared} d="M12 3.5 19 7v10l-7 3.5L5 17V7Z" />
      <path {...shared} d="m5.25 7.15 6.75 3.35 6.75-3.35M12 10.5V20" />
    </svg>
  );
}

function LocationGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M19 10.25c0 5.25-7 10.25-7 10.25S5 15.5 5 10.25a7 7 0 1 1 14 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="10.25"
        fill="none"
        r="2.35"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function VerifiedGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m12 3.5 2.15 1.35 2.52-.1 1.35 2.14 2.14 1.36-.1 2.51 1.35 2.15-1.35 2.15.1 2.51-2.14 1.36-1.35 2.14-2.52-.1L12 20.5l-2.15 1.35-2.52.1-1.35-2.14-2.14-1.36.1-2.51L2.5 13.8l1.35-2.15-.1-2.51L5.9 7.78l1.35-2.14 2.52.1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
      <path
        d="m8.7 12.1 2.1 2.1 4.45-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function DiscoveryHome() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [vendors, setVendors] = useState<PublicVendorSummary[]>([]);
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.all([
      publicApi.publicCategories(),
      publicApi.publicCities(),
      publicApi.publicVendors(),
    ])
      .then(([categoryResponse, cityResponse, vendorResponse]) => {
        setCategories(categoryResponse.categories);
        setCities(cityResponse.cities);
        setVendors(vendorResponse.items.slice(0, 3));
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) {
      const selected = cities.find((item) => item.id === city);
      if (selected) {
        params.set("city", selected.slug);
        params.set("state", selected.stateCode.toLowerCase());
      }
    }
    window.location.href = `/search${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <PageContainer className="setu-home-page setu-home-stack">
      <Reveal className="setu-landing-hero-motion">
        <header className="setu-landing-hero">
          <div className="setu-landing-copy">
            <p className="setu-eyebrow">A clearer way to find local help</p>
            <h1 className="setu-landing-title">
              Find trusted local <span>providers</span> near you.
            </h1>
            <p className="setu-landing-description">
              Explore reviewed service providers by category and city. Compare
              useful details, then start a direct inquiry when you are ready.
            </p>
            <div className="setu-hero-sequence" aria-label="How Setu works">
              <span>
                <b>01</b> Discover
              </span>
              <i aria-hidden="true" />
              <span>
                <b>02</b> Compare
              </span>
              <i aria-hidden="true" />
              <span>
                <b>03</b> Connect
              </span>
            </div>
            <form
              onSubmit={submit}
              className="setu-home-search"
              aria-label="Search providers"
            >
              <label className="setu-search-field" htmlFor="home-query">
                <span aria-hidden="true" className="setu-search-icon">
                  ⌕
                </span>
                <span className="sr-only">Service or category</span>
                <Input
                  id="home-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What service do you need?"
                />
              </label>
              <label className="setu-search-field" htmlFor="home-city">
                <span aria-hidden="true" className="setu-search-icon">
                  ⌖
                </span>
                <span className="sr-only">City</span>
                <Select
                  id="home-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="setu-search-select"
                >
                  <option value="">Enter your city</option>
                  {cities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}, {item.stateName}
                    </option>
                  ))}
                </Select>
              </label>
              <Button type="submit" size="lg">
                Search providers
              </Button>
            </form>
            <div
              className="setu-popular-searches"
              aria-label="Popular searches"
            >
              <span>Popular:</span>
              {categories.slice(0, 5).map((item) => (
                <Link key={item.slug} href={`/categories/${item.slug}`}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div
            className="setu-hero-showcase"
            aria-label="Setu service discovery preview"
          >
            <span className="setu-hero-visual-label">
              SETU / DISCOVERY LAYER
            </span>
            <div className="setu-showcase-orbit setu-showcase-orbit-large" />
            <div className="setu-showcase-orbit setu-showcase-orbit-small" />
            <div className="setu-showcase-card setu-showcase-card-primary">
              <div className="setu-showcase-avatar">S</div>
              <div>
                <p>Service provider</p>
                <strong>Public profile</strong>
                <span>Reviewed details</span>
              </div>
            </div>
            <div className="setu-showcase-card setu-showcase-card-secondary">
              <span className="setu-showcase-glyph">⌖</span>
              <div>
                <strong>Service areas</strong>
                <span>Nearby cities</span>
              </div>
            </div>
            <div className="setu-showcase-card setu-showcase-card-tertiary">
              <span className="setu-showcase-glyph">↗</span>
              <div>
                <strong>Direct inquiry</strong>
                <span>Start a conversation</span>
              </div>
            </div>
            <div className="setu-showcase-dots" aria-hidden="true">
              •••
            </div>
          </div>
        </header>
      </Reveal>

      <Reveal>
        <section className="setu-trust-strip" aria-label="Why use Setu">
          {[
            ["✦", "Reviewed applications", "Clear status at every step"],
            [
              "◇",
              "Private document handling",
              "Sensitive details stay protected",
            ],
            ["⌕", "Simple discovery", "Search by service and city"],
            ["↗", "Direct inquiries", "Reach out when it feels right"],
          ].map(([icon, title, description]) => (
            <div key={title} className="setu-trust-item">
              <span className="setu-trust-icon" aria-hidden="true">
                {icon}
              </span>
              <div>
                <strong>{title}</strong>
                <span>{description}</span>
              </div>
            </div>
          ))}
        </section>
      </Reveal>

      {loading ? (
        <LoadingState label="Loading categories and cities…" />
      ) : failed ? (
        <ErrorState
          title="We couldn't load discovery data"
          detail="Please try again shortly."
        />
      ) : null}

      <Reveal>
        <section
          aria-labelledby="popular-categories"
          className="setu-home-section setu-category-section"
        >
          <div className="setu-category-section-head">
            <div className="setu-category-section-copy">
              <p className="setu-eyebrow">Explore by need</p>
              <h2 id="popular-categories">Choose where to begin.</h2>
              <p>
                Start with a category, then narrow your search to the city and
                provider that feel right.
              </p>
            </div>
            <Link
              href="/categories"
              className="setu-category-all-link"
            >
              All categories <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="setu-category-grid">
            {categories.slice(0, 6).map((item, index) => (
              <Link
                key={item.slug}
                href={`/categories/${item.slug}`}
                className={`setu-category-card setu-reveal setu-reveal-delay-${Math.min(index + 1, 3)}`}
              >
                <Card className="h-full">
                  <div className="setu-category-card-top">
                    <div className="setu-category-icon">
                      <CategoryGlyph slug={item.slug} />
                    </div>
                    <span className="setu-category-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.description ??
                      "Explore approved providers in this category."}
                  </p>
                  <span className="setu-category-cta">
                    Browse services <span aria-hidden="true">↗</span>
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section
          aria-labelledby="popular-cities"
          className="setu-home-section setu-location-section"
        >
          <div className="setu-location-section-head">
            <div className="setu-location-section-copy">
              <p className="setu-eyebrow">Search close to home</p>
              <h2 id="popular-cities">Find help in your city.</h2>
              <p>
                Explore providers that are listed for the places you live,
                work, and need support.
              </p>
            </div>
            <Link href="/cities" className="setu-location-all-link">
              All locations <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="setu-city-grid">
            {cities.slice(0, 8).map((item, index) => (
              <Link
                key={item.id}
                href={`/cities/${item.stateCode.toLowerCase()}/${item.slug}`}
                className={`setu-city-card setu-reveal setu-reveal-delay-${Math.min(index + 1, 3)}`}
              >
                <span className="setu-city-icon">
                  <LocationGlyph />
                </span>
                <span className="setu-city-card-copy">
                  <strong>{item.name}</strong>
                  <span>{item.stateName}</span>
                </span>
                <span className="setu-city-card-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {vendors.length > 0 ? (
        <Reveal>
          <section className="setu-home-section setu-approved-section">
            <div className="setu-approved-section-head">
              <div className="setu-approved-section-copy">
                <p className="setu-eyebrow">Reviewed on Setu</p>
                <h2>Meet approved businesses.</h2>
                <p>
                  These providers have completed Setu&apos;s public review step
                  and are ready to be explored.
                </p>
              </div>
              <Link href="/search" className="setu-approved-all-link">
                See all providers <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="setu-vendor-grid">
              {vendors.map((vendor, index) => (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.slug}`}
                  className={`setu-vendor-card setu-reveal setu-reveal-delay-${Math.min(index + 1, 3)}`}
                >
                  <Card className="h-full">
                    <div className="setu-vendor-card-top">
                      <span className="setu-vendor-verified">
                        <VerifiedGlyph /> Verified
                      </span>
                      <span className="setu-vendor-monogram" aria-hidden="true">
                        {vendor.businessName.slice(0, 1)}
                      </span>
                    </div>
                    <h3>{vendor.businessName}</h3>
                    <p className="setu-vendor-location">
                      <LocationGlyph />
                      {vendor.primaryCity.name}, {vendor.primaryCity.stateName}
                    </p>
                    <div className="setu-vendor-tags">
                      {vendor.categories.slice(0, 2).map((category) => (
                        <span key={category.slug}>{category.name}</span>
                      ))}
                    </div>
                    <p className="setu-vendor-description line-clamp-3">
                      {vendor.descriptionExcerpt}
                    </p>
                    <span className="setu-vendor-cta">
                      View profile <span aria-hidden="true">↗</span>
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      ) : !loading && !failed ? (
        <EmptyState
          title="Approved providers are coming into view"
          description="Try browsing by category or city while more public profiles are reviewed."
          action={
            <Link
              className="setu-button setu-button-secondary setu-button-md"
              href="/categories"
            >
              Browse categories
            </Link>
          }
        />
      ) : null}

      <Reveal>
        <section className="setu-provider-cta" id="contact">
          <div>
            <p className="setu-eyebrow">For service providers</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Make your business easier to find.
            </h2>
          </div>
          <p className="max-w-2xl text-slate-600">
            Share your business details for review and become discoverable on
            Setu after approval.
          </p>
          <div className="setu-provider-cta-action">
            <Link
              href="/vendor/onboarding"
              className="setu-button setu-button-primary setu-button-md"
            >
              Start vendor onboarding
            </Link>
            <span>Powered by Dodun Soft Solutions</span>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section
          aria-label="Setu platform qualities"
          className="setu-feature-chip-row"
        >
          <FeatureChip
            detail="Clear, focused journeys"
            icon="✦"
            label="Modern and calm"
          />
          <FeatureChip
            detail="Designed around every screen"
            icon="▣"
            label="Responsive by default"
          />
          <FeatureChip
            detail="Respectful, reduced-motion aware"
            icon="◌"
            label="Thoughtful interactions"
          />
          <FeatureChip
            detail="Find, compare, then connect"
            icon="↗"
            label="Easy to explore"
          />
          <FeatureChip
            detail="Private account experiences"
            icon="◇"
            label="Built with care"
          />
        </section>
      </Reveal>
    </PageContainer>
  );
}
