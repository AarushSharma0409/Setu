"use client";

import { Button, LoadingState } from "@setu/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { adminApi, type AdminIdentity } from "../lib/admin-api-client";

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

  return (
    <div className="space-y-6">
      <header className="setu-admin-header -mx-4 -mt-8 sm:-mx-6 lg:-mx-8">
        <Link className="setu-admin-brand" href="/dashboard">
          <span className="setu-brand-mark" aria-hidden="true">
            S
          </span>
          Setu Operations
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {admin?.email}
          </span>
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
          {[
            ["/dashboard", "Overview"],
            ["/dashboard/system-status", "System status"],
            ["/dashboard/vendors", "Verification queue"],
            ["/dashboard/audit", "Audit log"],
            ["/insurance", "Insurance"],
            ["/insurance/products", "Product catalogue"],
            ["/insurance/ranking", "Ranking methods"],
            ["/insurance/integrations", "Provider integrations"],
            ["/insurance/operations", "Insurance operations"],
            ["/insurance/support", "Insurance support"],
          ].map(([href, label]) => (
            <Link
              className={`setu-admin-nav-link ${pathname === href || pathname.startsWith(`${href}/`) ? "setu-admin-nav-link-active" : ""}`}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="setu-admin-main space-y-6">{children}</div>
      </div>
    </div>
  );
}
