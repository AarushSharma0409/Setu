import { Card, PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";

import { discoveryApi } from "../../lib/discovery-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse service categories | Setu",
  description: "Explore approved service providers by category on Setu.",
  alternates: { canonical: "/categories" },
};

function categoryTone(slug: string) {
  if (slug.includes("home") || slug.includes("repair")) return "violet";
  if (slug.includes("event") || slug.includes("wedding")) return "amber";
  if (slug.includes("health") || slug.includes("wellness")) return "mint";
  if (slug.includes("auto")) return "blue";
  return "sky";
}

export default async function CategoriesPage() {
  const { categories } = await discoveryApi.categories();

  return (
    <PageContainer className="setu-categories-page">
      <section className="setu-categories-hero" aria-labelledby="categories-title">
        <div className="setu-categories-hero-copy">
          <p className="setu-eyebrow">Setu discovery directory</p>
          <h1 id="categories-title">Find the right kind of help.</h1>
          <p>
            Browse by service first, then explore approved providers in the
            places that matter to you.
          </p>
          <div className="setu-categories-hero-meta">
            <span>
              <b>{categories.length}</b> categories to explore
            </span>
            <i aria-hidden="true" />
            <span>Reviewed provider listings</span>
          </div>
        </div>
        <div className="setu-categories-hero-visual" aria-hidden="true">
          <span className="setu-categories-orbit setu-categories-orbit-one" />
          <span className="setu-categories-orbit setu-categories-orbit-two" />
          <span className="setu-categories-spark setu-categories-spark-one" />
          <span className="setu-categories-spark setu-categories-spark-two" />
          <div className="setu-categories-visual-card">
            <span>01</span>
            <strong>Choose a category</strong>
            <small>Start with your need</small>
          </div>
          <div className="setu-categories-visual-pill">DISCOVERY / SETU</div>
        </div>
      </section>

      <section className="setu-directory-section" aria-labelledby="directory-title">
        <div className="setu-directory-section-head">
          <div>
            <p className="setu-eyebrow">Browse the directory</p>
            <h2 id="directory-title">What can we help you find?</h2>
          </div>
          <p>Every category leads to public profiles that are ready to explore.</p>
        </div>
        <div className="setu-directory-category-grid">
          {categories.map((category, index) => (
            <Link
              className="setu-directory-category-card"
              href={`/categories/${category.slug}`}
              key={category.id}
            >
              <Card className="h-full">
                <div className="setu-directory-category-card-top">
                  <span
                    className={`setu-directory-category-icon setu-directory-category-icon-${categoryTone(category.slug)}`}
                    aria-hidden="true"
                  >
                    {category.name.slice(0, 1)}
                  </span>
                  <span className="setu-directory-category-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>{category.name}</h3>
                <p>
                  {category.description ??
                    "Find approved providers in this category."}
                </p>
                <span className="setu-directory-category-cta">
                  Explore providers <span aria-hidden="true">↗</span>
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="setu-categories-guidance">
        <div className="setu-categories-guidance-mark" aria-hidden="true">
          S
        </div>
        <div>
          <p className="setu-eyebrow">Not sure where to start?</p>
          <h2>Describe what you need in your own words.</h2>
          <p>
            Search by service, business, or city and we&apos;ll help you find a
            useful starting point.
          </p>
        </div>
        <Link className="setu-categories-guidance-link" href="/search">
          Search Setu <span aria-hidden="true">→</span>
        </Link>
      </section>
    </PageContainer>
  );
}
