import { Card, PageContainer, StatusBadge } from "@setu/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscoveryError } from "../../../components/discovery-error";
import { InquiryForm } from "../../../components/inquiry-form";
import {
  DiscoveryNotFoundError,
  discoveryApi,
} from "../../../lib/discovery-api";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ vendorSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { vendor } = await discoveryApi.vendor((await params).vendorSlug);

    return {
      title: `${vendor.businessName} | Verified provider on Setu`,
      description: vendor.description.slice(0, 155),
      alternates: { canonical: `/vendors/${vendor.slug}` },
    };
  } catch {
    return { title: "Vendor not found | Setu" };
  }
}

export default async function VendorPage({ params }: Props) {
  try {
    const { vendor } = await discoveryApi.vendor((await params).vendorSlug);

    return (
      <PageContainer>
        <div className="setu-provider-page">
          <div className="setu-profile-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <main>
              <header className="setu-profile-header">
                <div className="setu-profile-avatar" aria-hidden="true">
                  {vendor.businessName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="setu-eyebrow">Approved provider</p>
                    <StatusBadge status="APPROVED" />
                  </div>
                  <h1>{vendor.businessName}</h1>
                  <p className="setu-profile-location">
                    <span aria-hidden="true">Location</span>
                    {vendor.primaryCity.name}, {vendor.primaryCity.stateName}
                  </p>
                </div>
              </header>

              <nav
                className="setu-profile-tabs"
                aria-label="Vendor profile sections"
              >
                <a className="setu-profile-tab-active" href="#overview">
                  Overview
                </a>
                <a href="#services">Services</a>
                <a href="#areas">Service areas</a>
              </nav>

              <Card
                className="mt-6 setu-profile-about"
                elevation="raised"
                id="overview"
              >
                <p className="setu-eyebrow">About this business</p>
                <h2>Built to help with the work that matters.</h2>
                <p>{vendor.description}</p>
              </Card>

              <div className="setu-profile-detail-grid">
                <section className="setu-profile-detail-section" id="services">
                  <p className="setu-eyebrow">What they offer</p>
                  <h2>Services</h2>
                  <div className="setu-profile-tag-list">
                    {vendor.categories.map((category) => (
                      <span key={category.slug} className="setu-profile-tag">
                        {category.name}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="setu-profile-detail-section" id="areas">
                  <p className="setu-eyebrow">Where they work</p>
                  <h2>Service areas</h2>
                  <ul className="setu-profile-area-list">
                    {vendor.serviceAreas.map((city) => (
                      <li
                        key={`${city.stateCode}-${city.slug}`}
                        className="setu-profile-area"
                      >
                        <span aria-hidden="true">Location</span>
                        {city.name}, {city.stateName}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </main>

            <aside className="setu-profile-aside space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card className="setu-profile-info-card">
                <div className="setu-profile-info-heading">
                  <div>
                    <p className="setu-eyebrow">Verified business</p>
                    <h2>Contact details</h2>
                  </div>
                  <span aria-hidden="true">Info</span>
                </div>

                <div className="setu-profile-contact-list">
                  {vendor.legalName ? (
                    <ContactRow
                      icon="Business"
                      label="Legal business name"
                      value={vendor.legalName}
                    />
                  ) : null}
                  {vendor.yearEstablished ? (
                    <ContactRow
                      icon="Since"
                      label="Established"
                      value={String(vendor.yearEstablished)}
                    />
                  ) : null}
                  {vendor.contactPhone ? (
                    <ContactRow
                      icon="Phone"
                      label="Phone"
                      href={`tel:${vendor.contactPhone}`}
                      value={vendor.contactPhone}
                    />
                  ) : null}
                  {vendor.contactEmail ? (
                    <ContactRow
                      icon="Email"
                      label="Email"
                      href={`mailto:${vendor.contactEmail}`}
                      value={vendor.contactEmail}
                    />
                  ) : null}
                  {vendor.websiteUrl ? (
                    <ContactRow
                      external
                      icon="Web"
                      label="Website"
                      href={vendor.websiteUrl}
                      value={displayWebsite(vendor.websiteUrl)}
                    />
                  ) : null}
                </div>

                {!vendor.contactPhone &&
                !vendor.contactEmail &&
                !vendor.websiteUrl ? (
                  <p className="setu-profile-contact-unavailable">
                    This provider has not published direct contact details. Send
                    a private inquiry instead.
                  </p>
                ) : null}

                <p className="setu-profile-verification-note">
                  Setu verification confirms that this business completed the
                  platform review process. It does not guarantee service
                  quality.
                </p>
              </Card>

              <InquiryForm
                vendorId={vendor.id}
                vendorName={vendor.businessName}
                returnPath={`/vendors/${vendor.slug}`}
              />
            </aside>
          </div>
        </div>
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
                  name: "Vendors",
                  item: "/search",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: vendor.businessName,
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

function ContactRow({
  icon,
  label,
  value,
  href,
  external = false,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="setu-profile-contact-row">
      <span className="setu-profile-contact-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <small>{label}</small>
        {href ? (
          <a
            href={href}
            rel={external ? "noreferrer" : undefined}
            target={external ? "_blank" : undefined}
          >
            {value}
          </a>
        ) : (
          <strong>{value}</strong>
        )}
      </div>
    </div>
  );
}

function displayWebsite(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}
