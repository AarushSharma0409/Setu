import type { PublicVendorSummary } from "@setu/types";
import { Card } from "@setu/ui";
import Link from "next/link";

export function VendorCard({ vendor }: { vendor: PublicVendorSummary }) {
  return (
    <Card className="setu-discovery-vendor-card">
      <div className="setu-discovery-vendor-card-top">
        <span className="setu-discovery-vendor-monogram" aria-hidden="true">
          {vendor.businessName.slice(0, 1)}
        </span>
        <span className="setu-discovery-vendor-approved">Approved</span>
      </div>
      <h2>{vendor.businessName}</h2>
      <p className="setu-discovery-vendor-location">
        <span aria-hidden="true">⌖</span> {vendor.primaryCity.name}, {vendor.primaryCity.stateName}
      </p>
      <p className="setu-discovery-vendor-description">{vendor.descriptionExcerpt}</p>
      <div className="setu-discovery-vendor-tags">
        {vendor.categories.slice(0, 3).map((category) => <span key={category.slug}>{category.name}</span>)}
      </div>
      <Link href={`/vendors/${vendor.slug}`} className="setu-discovery-vendor-cta">Explore profile <span aria-hidden="true">→</span></Link>
    </Card>
  );
}
