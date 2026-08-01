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
  Input,
  LoadingState,
  PageContainer,
} from "@setu/ui";
import Link from "next/link";
import React, { useEffect, useState, type FormEvent } from "react";

import { publicApi } from "../lib/api-client";

export function DiscoveryHome() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [vendors, setVendors] = useState<PublicVendorSummary[]>([]);
  const [category, setCategory] = useState("");
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
    if (category) params.set("category", category);
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
    <PageContainer className="space-y-12">
      <header className="setu-hero grid gap-8 rounded-2xl p-6 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-10">
        <div className="max-w-2xl">
          <p className="setu-eyebrow">Verified providers, clearer choices</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Find trusted service providers across your city.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Explore approved businesses by category and location. Setu helps you
            start with useful, public information.
          </p>
        </div>
        <Card className="border-blue-100 shadow-md">
          <h2 className="text-lg font-semibold">Start exploring</h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-sm font-medium" htmlFor="home-query">
              Search
            </label>
            <Input
              id="home-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What service do you need?"
            />
            <label
              className="block text-sm font-medium"
              htmlFor="home-category"
            >
              Category
            </label>
            <select
              id="home-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium" htmlFor="home-city">
              City
            </label>
            <select
              id="home-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All cities</option>
              {cities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}, {item.stateName}
                </option>
              ))}
            </select>
            <Button type="submit" className="w-full">
              Search approved providers
            </Button>
          </form>
        </Card>
      </header>

      {loading ? (
        <LoadingState label="Loading categories and cities…" />
      ) : failed ? (
        <ErrorState
          title="We couldn't load discovery data"
          detail="Please try again shortly."
        />
      ) : null}

      <section aria-labelledby="popular-categories">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Browse
            </p>
            <h2 className="mt-1 text-2xl font-semibold" id="popular-categories">
              Popular categories
            </h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold underline">
            View all categories
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((item) => (
            <Link key={item.slug} href={`/categories/${item.slug}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <div
                  className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 font-bold text-blue-700"
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

      <section aria-labelledby="popular-cities">
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
        <div className="mt-4 flex flex-wrap gap-3">
          {cities.slice(0, 8).map((item) => (
            <Link
              key={item.id}
              href={`/cities/${item.stateCode.toLowerCase()}/${item.slug}`}
              className="rounded-full border bg-white px-4 py-2 text-sm hover:border-slate-400"
            >
              {item.name}, {item.stateName}
            </Link>
          ))}
        </div>
      </section>

      {vendors.length > 0 ? (
        <section>
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
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {vendors.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.slug}`}>
                <Card className="h-full transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Approved provider
                  </p>
                  <h3 className="mt-2 font-semibold">{vendor.businessName}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {vendor.descriptionExcerpt}
                  </p>
                  <span className="mt-4 inline-block text-sm font-semibold text-blue-700">
                    View profile →
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
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

      <section className="rounded-lg bg-slate-950 p-6 text-white">
        <h2 className="text-2xl font-semibold">Are you a service provider?</h2>
        <p className="mt-2 max-w-2xl text-slate-300">
          Share your business details for review and become discoverable on Setu
          after approval.
        </p>
        <Link
          href="/vendor/onboarding"
          className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Start vendor onboarding
        </Link>
      </section>
    </PageContainer>
  );
}
