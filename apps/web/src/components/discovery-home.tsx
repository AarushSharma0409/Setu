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
          id="how-it-works"
          className="setu-home-section"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Browse
              </p>
              <h2
                className="mt-1 text-2xl font-semibold"
                id="popular-categories"
              >
                Popular categories
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-sm font-semibold underline"
            >
              View all categories
            </Link>
          </div>
          <div className="setu-category-grid mt-4">
            {categories.slice(0, 4).map((item, index) => (
              <Link
                key={item.slug}
                href={`/categories/${item.slug}`}
                className={`setu-reveal setu-reveal-delay-${Math.min(index + 1, 3)}`}
              >
                <Card className="setu-card-interactive h-full">
                  <div
                    className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-violet-50 font-bold text-violet-700"
                    aria-hidden="true"
                  >
                    {item.name.slice(0, 1)}
                  </div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.description ??
                      "Explore approved providers in this category."}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="popular-cities" className="setu-home-section">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Locations
              </p>
              <h2 className="mt-1 text-2xl font-semibold" id="popular-cities">
                Browse cities
              </h2>
            </div>
            <Link href="/cities" className="text-sm font-semibold underline">
              View all cities
            </Link>
          </div>
          <div className="setu-city-list mt-4">
            {cities.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                href={`/cities/${item.stateCode.toLowerCase()}/${item.slug}`}
                className="setu-city-chip"
              >
                {item.name}, {item.stateName}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {vendors.length > 0 ? (
        <Reveal>
          <section className="setu-home-section" id="about">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Approved businesses
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Verified providers
                </h2>
              </div>
              <Link href="/search" className="text-sm font-semibold underline">
                View all providers
              </Link>
            </div>
            <div className="setu-vendor-grid mt-4">
              {vendors.map((vendor) => (
                <Link key={vendor.id} href={`/vendors/${vendor.slug}`}>
                  <Card className="setu-card-interactive h-full">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Approved provider
                    </p>
                    <h3 className="mt-2 font-semibold">
                      {vendor.businessName}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                      {vendor.descriptionExcerpt}
                    </p>
                    <span className="mt-4 inline-block text-sm font-semibold text-violet-700">
                      View profile →
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
          <Link
            href="/vendor/onboarding"
            className="setu-button setu-button-primary setu-button-md"
          >
            Start vendor onboarding
          </Link>
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
