import {
  Button,
  EmptyState,
  Input,
  PageContainer,
  PageHeader,
  Select,
} from "@setu/ui";
import type { Metadata } from "next";

import { DiscoveryError } from "../../components/discovery-error";
import { Pagination } from "../../components/pagination";
import { VendorCard } from "../../components/vendor-card";
import { discoveryApi } from "../../lib/discovery-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search service providers | Setu",
  description: "Search approved service providers on Setu.",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = {
    q: first(params.q),
    category: first(params.category),
    city: first(params.city),
    state: first(params.state),
    sort: first(params.sort) as
      "relevance" | "name_asc" | "name_desc" | "newest" | "oldest" | undefined,
    page: Number(first(params.page) ?? "1"),
  };
  try {
    const result = await discoveryApi.vendors(query);
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Discovery"
          title="Find an approved provider"
          description="Search by business, service, category, or city. Results only include profiles meeting Setu’s public visibility rules."
        />
        <form
          className="setu-card grid gap-4 md:grid-cols-[1fr_12rem_auto]"
          action="/search"
        >
          <label className="sr-only" htmlFor="search-query">
            Search
          </label>
          <Input
            id="search-query"
            name="q"
            defaultValue={query.q}
            placeholder="Search by business, service, or city"
          />
          <Select name="sort" defaultValue={query.sort ?? "name_asc"}>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="newest">Recently approved</option>
            <option value="oldest">Earliest approved</option>
          </Select>
          <Button type="submit">Search</Button>
        </form>
        {result.items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No providers match these filters"
              description="Try a broader search or clear one of the filters to see more approved providers."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
        <Pagination
          pagination={result.pagination}
          pathname="/search"
          params={{
            q: query.q,
            category: query.category,
            city: query.city,
            state: query.state,
            sort: query.sort,
          }}
        />
      </PageContainer>
    );
  } catch {
    return (
      <PageContainer>
        <DiscoveryError />
      </PageContainer>
    );
  }
}
