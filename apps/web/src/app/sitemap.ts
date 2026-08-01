import type { MetadataRoute } from "next";

import { discoveryApi } from "../lib/discovery-api";
import { webEnv } from "../lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = webEnv.NEXT_PUBLIC_WEB_URL;
  try {
    const [{ categories }, { cities }, vendors] = await Promise.all([
      discoveryApi.categories(),
      discoveryApi.cities(),
      discoveryApi.vendors({ pageSize: 50 }),
    ]);
    return [
      { url: `${base}/` },
      { url: `${base}/categories` },
      { url: `${base}/cities` },
      ...categories.map((category) => ({
        url: `${base}/categories/${category.slug}`,
      })),
      ...cities.map((city) => ({
        url: `${base}/cities/${city.stateCode.toLowerCase()}/${city.slug}`,
      })),
      ...vendors.items.map((vendor) => ({
        url: `${base}/vendors/${vendor.slug}`,
      })),
    ];
  } catch {
    return [{ url: `${base}/` }];
  }
}
