import { Card, PageContainer, PageHeader } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "../../components/breadcrumbs";
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
    <PageContainer>
      <Breadcrumbs items={[{ label: "Cities" }]} />
      <PageHeader
        eyebrow="Discovery"
        title="Browse cities"
        description="Find approved providers serving cities across India."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cities.map((city) => (
          <Link
            href={`/cities/${city.stateCode.toLowerCase()}/${city.slug}`}
            key={city.id}
          >
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
              <h2 className="font-semibold">{city.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{city.stateName}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
