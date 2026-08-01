import { Card, PageContainer, PageHeader } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "../../components/breadcrumbs";
import { discoveryApi } from "../../lib/discovery-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse service categories | Setu",
  description: "Explore approved service providers by category on Setu.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const { categories } = await discoveryApi.categories();
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Categories" }]} />
      <PageHeader
        eyebrow="Discovery"
        title="Browse categories"
        description="Explore approved providers across useful service categories."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link href={`/categories/${category.slug}`} key={category.id}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
              <div
                className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 font-bold text-blue-700"
                aria-hidden="true"
              >
                {category.name.slice(0, 1)}
              </div>
              <h2 className="text-lg font-semibold">{category.name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {category.description ??
                  "Find approved providers in this category."}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
