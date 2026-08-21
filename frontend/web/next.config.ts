import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    devtoolSegmentExplorer: false,
  },
  transpilePackages: ["@setu/ui", "@setu/types"],
  async headers() {
    await Promise.resolve();
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiOrigin = configuredApiUrl?.startsWith("http")
      ? configuredApiUrl.replace(/\/api\/v1\/?$/, "")
      : "'self'";
    const isProduction = process.env.NODE_ENV === "production";
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client" +
        (isProduction ? "" : " 'unsafe-eval'"),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.googleusercontent.com",
      `connect-src 'self' ${apiOrigin} https://accounts.google.com https://oauth2.googleapis.com`,
      "font-src 'self' data:",
      "frame-src https://accounts.google.com",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/account/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/insurance/needs/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/insurance/handoff/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
