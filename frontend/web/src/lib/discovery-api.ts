import type {
  PublicCategory,
  PublicCity,
  PublicVendorDetail,
  PublicVendorListResponse,
} from "@setu/types";

import { webEnv } from "./env";

export interface DiscoveryQuery {
  q?: string;
  category?: string;
  city?: string;
  state?: string;
  page?: number;
  pageSize?: number;
  sort?: "relevance" | "name_asc" | "name_desc" | "newest" | "oldest";
  yearEstablishedFrom?: number;
}

async function discoveryFetch<T>(path: string): Promise<T> {
  const baseUrl =
    typeof window === "undefined"
      ? (process.env.SETU_INTERNAL_API_URL ?? webEnv.NEXT_PUBLIC_API_URL)
      : webEnv.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 404)
      return Promise.reject(new DiscoveryNotFoundError());
    throw new Error("Discovery service is temporarily unavailable");
  }
  return (await response.json()) as T;
}

export class DiscoveryNotFoundError extends Error {
  constructor() {
    super("Discovery resource not found");
    this.name = "DiscoveryNotFoundError";
  }
}

export const discoveryApi = {
  categories: () =>
    discoveryFetch<{ categories: PublicCategory[] }>("/public/categories"),
  category: (slug: string, query: DiscoveryQuery = {}) =>
    discoveryFetch<{
      category: PublicCategory;
      items: PublicVendorListResponse["items"];
      pagination: PublicVendorListResponse["pagination"];
    }>(`/public/categories/${encodeURIComponent(slug)}${toQuery(query)}`),
  cities: () => discoveryFetch<{ cities: PublicCity[] }>("/public/cities"),
  city: (stateSlug: string, citySlug: string, query: DiscoveryQuery = {}) =>
    discoveryFetch<{
      city: PublicCity;
      items: PublicVendorListResponse["items"];
      pagination: PublicVendorListResponse["pagination"];
    }>(
      `/public/cities/${encodeURIComponent(stateSlug)}/${encodeURIComponent(citySlug)}${toQuery(query)}`,
    ),
  vendors: (query: DiscoveryQuery = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    return discoveryFetch<PublicVendorListResponse>(
      `/public/vendors?${params.toString()}`,
    );
  },
  vendor: (slug: string) =>
    discoveryFetch<{ vendor: PublicVendorDetail }>(
      `/public/vendors/${encodeURIComponent(slug)}`,
    ),
};

function toQuery(query: DiscoveryQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}
