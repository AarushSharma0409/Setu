import { NextResponse, type NextRequest } from "next/server";

/**
 * The former insurance assessment/quote UI is intentionally not part of the
 * Setu referral product. Keep old bookmarks safe by sending them to the same
 * category directory used by every other service.
 */
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL("/categories/finance", request.url));
}

export const config = {
  matcher: ["/insurance/:path*", "/account/insurance/:path*"],
};
