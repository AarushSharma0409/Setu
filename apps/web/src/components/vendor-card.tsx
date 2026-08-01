import type { PublicVendorSummary } from "@setu/types";
import { Card, StatusBadge } from "@setu/ui";
import Link from "next/link";

export function VendorCard({ vendor }: { vendor: PublicVendorSummary }) {
  return (
    <Card className="setu-card-interactive group flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-lg font-semibold text-slate-950">
          {vendor.businessName}
        </h2>
        <StatusBadge status="APPROVED" />
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-slate-600">
        {vendor.descriptionExcerpt}
      </p>
      <p className="text-sm font-medium text-slate-500">
        <span aria-hidden="true">●</span> {vendor.primaryCity.name},{" "}
        {vendor.primaryCity.stateName}
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        {vendor.categories.slice(0, 3).map((category) => (
          <span
            key={category.slug}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
          >
            {category.name}
          </span>
        ))}
      </div>
      <Link
        href={`/vendors/${vendor.slug}`}
        className="mt-1 text-sm font-semibold text-violet-700 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline"
      >
        View {vendor.businessName}
      </Link>
    </Card>
  );
}
