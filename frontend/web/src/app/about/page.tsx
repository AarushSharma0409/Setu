import { Card, PageContainer, Reveal } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Setu | Local services, made clearer",
  description:
    "Learn how Setu helps people discover approved local service providers and helps businesses become easier to find.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    detail:
      "Find services by the category and city that make sense for your need.",
    icon: "01",
    title: "Clarity before contact",
  },
  {
    detail:
      "Businesses move through a review process before public visibility.",
    icon: "02",
    title: "Thoughtful visibility",
  },
  {
    detail: "Keep discovery, inquiries, and vendor workspaces straightforward.",
    icon: "03",
    title: "Useful, not noisy",
  },
];

export default function AboutPage() {
  return (
    <PageContainer className="setu-about-page">
      <Reveal>
        <header className="setu-about-hero">
          <div className="setu-about-hero-copy">
            <p className="setu-eyebrow">About Setu</p>
            <h1>A more human way to find local help.</h1>
            <p>
              Setu brings people and local service providers together through
              clearer discovery, considered business profiles, and direct
              inquiry journeys.
            </p>
            <div className="setu-about-actions">
              <Link
                className="setu-button setu-button-primary setu-button-md"
                href="/categories"
              >
                Explore services
              </Link>
              <Link
                className="setu-button setu-button-outline setu-button-md"
                href="/vendor/onboarding"
              >
                Join as a provider
              </Link>
            </div>
          </div>
          <div className="setu-about-signal" aria-label="The Setu approach">
            <p>Our approach</p>
            <div className="setu-about-signal-orbit" aria-hidden="true">
              <span>Discover</span>
              <span>Decide</span>
              <span>Connect</span>
            </div>
            <strong>Local connections, made clearer.</strong>
          </div>
        </header>
      </Reveal>

      <Reveal>
        <section className="setu-about-story">
          <div>
            <p className="setu-eyebrow">Why Setu exists</p>
            <h2>Good local decisions should not begin with a guess.</h2>
          </div>
          <p>
            Whether someone is looking for a service or a business is looking to
            be discovered, the process should feel calm and understandable. Setu
            is building a focused place to explore relevant providers,
            understand the next step, and make contact when ready.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="setu-principles" className="setu-about-grid">
          <div className="setu-about-section-heading">
            <p className="setu-eyebrow">Built around useful moments</p>
            <h2 id="setu-principles">What guides the experience</h2>
          </div>
          <div className="setu-about-principles">
            {principles.map((principle) => (
              <Card className="setu-about-principle" key={principle.title}>
                <span aria-hidden="true">{principle.icon}</span>
                <h3>{principle.title}</h3>
                <p>{principle.detail}</p>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="setu-about-boundary">
          <div>
            <p className="setu-eyebrow">A useful distinction</p>
            <h2>Review is not a promise of service quality.</h2>
          </div>
          <p>
            Setu’s approval status reflects completion of its platform review
            process. Customers should still consider the information available,
            ask the questions that matter, and make the choice that is right for
            them.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="setu-about-next">
          <div>
            <p className="setu-eyebrow">Start where you are</p>
            <h2>
              Explore local services or make your business easier to find.
            </h2>
          </div>
          <div className="setu-about-actions">
            <Link
              className="setu-button setu-button-primary setu-button-md"
              href="/search"
            >
              Find a provider
            </Link>
            <Link
              className="setu-button setu-button-secondary setu-button-md"
              href="/vendor/onboarding"
            >
              Become a provider
            </Link>
          </div>
        </section>
      </Reveal>
    </PageContainer>
  );
}
