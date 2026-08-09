"use client";

import { Button, LoadingState } from "@setu/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { adminApi, type AdminIdentity } from "../lib/admin-api-client";

const primaryNavigation = [
  ["/dashboard", "Overview", "01"],
  ["/dashboard/system-status", "System status", "02"],
  ["/dashboard/vendors", "Verification queue", "03"],
  ["/dashboard/audit", "Audit log", "04"],
] as const;

const insuranceNavigation = [
  ["/insurance", "Insurance overview", "01"],
  ["/insurance/products", "Product catalogue", "02"],
  ["/insurance/ranking", "Ranking methods", "03"],
  ["/insurance/integrations", "Provider integrations", "04"],
  ["/insurance/operations", "Insurance operations", "05"],
  ["/insurance/support", "Insurance support", "06"],
] as const;

export function ProtectedShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("setu_admin_access_token");

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    adminApi
      .me(accessToken)
      .then((result) => setAdmin(result.admin))
      .catch(() => router.replace("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  async function logout() {
    await adminApi.logout();
    sessionStorage.removeItem("setu_admin_access_token");
    router.replace("/login");
  }

  if (checking) {
    return <LoadingState label="Checking your operations session" />;
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="setu-admin-application">
      <header className="setu-admin-header -mx-4 -mt-8 sm:-mx-6 lg:-mx-8">
        <Link className="setu-admin-brand" href="/dashboard">
          <span className="setu-admin-brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            <strong>Setu</strong>
            <small>Operations console</small>
          </span>
        </Link>
        <div className="setu-admin-session">
          <span className="setu-admin-session-signal" aria-hidden="true" />
          <div className="hidden sm:block">
            <strong>{admin?.email}</strong>
            <span>{admin?.role.replaceAll("_", " ") ?? "Admin session"}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void logout()}
          >
            Log out
          </Button>
        </div>
      </header>
      <div className="setu-admin-layout">
        <nav aria-label="Operations navigation" className="setu-admin-sidebar">
          <div className="setu-admin-sidebar-intro">
            <span>Internal workspace</span>
            <strong>Control center</strong>
          </div>
          <div className="setu-admin-nav-group">
            <p>Core operations</p>
            {primaryNavigation.map(([href, label, index]) => (
              <Link
                className={`setu-admin-nav-link ${isActive(href) ? "setu-admin-nav-link-active" : ""}`}
                href={href}
                key={href}
              >
                <span aria-hidden="true">{index}</span>
                {label}
              </Link>
            ))}
          </div>
          <div className="setu-admin-nav-group">
            <p>Insurance administration</p>
            {insuranceNavigation.map(([href, label, index]) => (
              <Link
                className={`setu-admin-nav-link ${isActive(href) ? "setu-admin-nav-link-active" : ""}`}
                href={href}
                key={href}
              >
                <span aria-hidden="true">{index}</span>
                {label}
              </Link>
            ))}
          </div>
          <div className="setu-admin-sidebar-footer">
            <span className="setu-admin-session-signal" aria-hidden="true" />
            MFA-protected session
          </div>
        </nav>
        <div className="setu-admin-main">{children}</div>
      </div>
    </div>
  );
}
