"use client";

import { Button } from "@setu/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { publicApi } from "../lib/api-client";

const tokenKey = "setu_public_access_token";

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(Boolean(sessionStorage.getItem(tokenKey)));
  }, [pathname]);

  async function logout() {
    await publicApi.logout().catch(() => undefined);
    sessionStorage.removeItem(tokenKey);
    setAuthenticated(false);
    setOpen(false);
    window.location.assign("/");
  }

  const linkClass = (href: string) =>
    `setu-nav-link ${pathname === href || pathname.startsWith(`${href}/`) ? "setu-nav-link-active" : ""}`;

  return (
    <div className="min-h-screen">
      <a className="setu-skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="setu-public-header">
        <div className="setu-public-header-inner">
          <Link aria-label="Setu home" className="setu-brand" href="/">
            <span className="setu-brand-mark" aria-hidden="true">
              S
            </span>
            <span>Setu</span>
          </Link>
          <button
            aria-controls="public-navigation"
            aria-expanded={open}
            className="setu-mobile-nav-trigger"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span className="sr-only">Toggle navigation</span>
            <span aria-hidden="true">{open ? "×" : "☰"}</span>
          </button>
          <nav
            aria-label="Primary navigation"
            className={`setu-public-nav ${open ? "setu-public-nav-open" : ""}`}
            id="public-navigation"
          >
            <div className="setu-nav-links">
              <Link
                className={linkClass("/")}
                href="/"
                onClick={() => setOpen(false)}
              >
                Home
              </Link>
              <Link
                className={linkClass("/categories")}
                href="/categories"
                onClick={() => setOpen(false)}
              >
                Categories
              </Link>
              <Link
                className={linkClass("/insurance")}
                href="/insurance"
                onClick={() => setOpen(false)}
              >
                Insurance
              </Link>
              <Link
                className={linkClass("/about")}
                href="/about"
                onClick={() => setOpen(false)}
              >
                About Setu
              </Link>
              <Link
                className="setu-nav-link"
                href="/#contact"
                onClick={() => setOpen(false)}
              >
                Contact
              </Link>
            </div>
            <div className="setu-nav-actions">
              {authenticated ? (
                <>
                  <Link
                    className={linkClass("/account/inquiries")}
                    href="/account/inquiries"
                    onClick={() => setOpen(false)}
                  >
                    My inquiries
                  </Link>
                  <Link
                    className={linkClass("/account/notifications")}
                    href="/account/notifications"
                    onClick={() => setOpen(false)}
                  >
                    Notifications
                  </Link>
                  <Link
                    className={linkClass("/account/insurance/quotes")}
                    href="/account/insurance/quotes"
                    onClick={() => setOpen(false)}
                  >
                    My quotes
                  </Link>
                  <Link
                    className={linkClass("/account/insurance/saved-quotes")}
                    href="/account/insurance/saved-quotes"
                    onClick={() => setOpen(false)}
                  >
                    Saved quotes
                  </Link>
                  <Link
                    className={linkClass("/vendor/inquiries")}
                    href="/vendor/inquiries"
                    onClick={() => setOpen(false)}
                  >
                    Vendor workspace
                  </Link>
                  <Button
                    onClick={() => void logout()}
                    size="sm"
                    variant="outline"
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    className="setu-nav-login"
                    href="/dev-auth"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    className="setu-button setu-button-primary setu-button-sm"
                    href="/dev-auth?intent=signup"
                    onClick={() => setOpen(false)}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      {children}
      <footer className="setu-public-footer">
        <div className="setu-public-footer-inner">
          <div>
            <p className="setu-brand setu-brand-footer">
              <span className="setu-brand-mark" aria-hidden="true">
                S
              </span>
              Setu
            </p>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              A clearer way to discover approved service providers across India.
            </p>
            <p className="setu-footer-powered">
              <span aria-hidden="true">✦</span> Powered by Dodun Soft Solutions
            </p>
          </div>
          <nav aria-label="Footer navigation" className="setu-footer-links">
            <Link href="/categories">Categories</Link>
            <Link href="/cities">Cities</Link>
            <Link href="/search">Find a vendor</Link>
            <Link href="/about">About Setu</Link>
            <Link href="/insurance">Explore insurance</Link>
            <Link href="/vendor/onboarding">Become a vendor</Link>
          </nav>
          <address className="setu-footer-contact">
            <p>Contact Setu</p>
            <a href="mailto:support@setu.example">support@setu.example</a>
            <a href="tel:+919000000000">+91 90000 00000</a>
            <small>Demo details — replace before launch.</small>
          </address>
        </div>
        <div className="setu-footer-bottom">
          <span>© {new Date().getFullYear()} Setu</span>
          <span>
            Verification confirms review completion, not service quality.
          </span>
        </div>
      </footer>
    </div>
  );
}
