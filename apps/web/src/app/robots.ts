import type { MetadataRoute } from "next";

import { webEnv } from "../lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev-auth", "/vendor/status", "/vendor/onboarding"],
    },
    sitemap: `${webEnv.NEXT_PUBLIC_WEB_URL}/sitemap.xml`,
  };
}
