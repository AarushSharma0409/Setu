import { PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";

import { discoveryApi } from "../../lib/discovery-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Browse cities | Setu",
  description: "Explore approved service providers by city on Setu.",
  alternates: { canonical: "/cities" },
};

export default async function CitiesPage() {
  const { cities } = await discoveryApi.cities();
  return (
    <PageContainer className="setu-discovery-page">
      <section className="setu-discovery-hero setu-discovery-hero-cities">
        <div>
          <p className="setu-eyebrow">Explore by location</p>
          <h1>Find trusted help, closer to home.</h1>
          <p>
            Choose your city to browse approved local businesses and services
            already available on Setu.
          </p>
        </div>
        <div className="setu-discovery-hero-stat">
          <strong>{String(cities.length).padStart(2, "0")}</strong>
          <span>cities<br />to explore</span>
        </div>
      </section>
      <section className="setu-discovery-directory" aria-labelledby="cities-directory-title">
        <div className="setu-discovery-directory-head">
          <div>
            <p className="setu-eyebrow">City directory</p>
            <h2 id="cities-directory-title">Where are you looking?</h2>
          </div>
          <p>Start local. You can refine by service after choosing a city.</p>
        </div>
        <div className="setu-city-directory-grid">
        {cities.map((city) => (
          <Link
            className="setu-city-directory-card"
            href={`/cities/${city.stateCode.toLowerCase()}/${city.slug}`}
            key={city.id}
          >
            <span className="setu-city-directory-mark" aria-hidden="true">{city.name.slice(0, 1)}</span>
            <span className="setu-city-directory-copy"><strong>{city.name}</strong><small>{city.stateName}</small></span>
            <span className="setu-city-directory-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
        </div>
      </section>
    </PageContainer>
  );
}
