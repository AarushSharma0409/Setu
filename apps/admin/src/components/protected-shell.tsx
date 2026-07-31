"use client";

import { Button, Card, LoadingState } from "@setu/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { adminApi, type AdminIdentity } from "../lib/admin-api-client";

export function ProtectedShell({ children }: { children: ReactNode }) {
  const router = useRouter();
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
    return <LoadingState label="Checking admin session" />;
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Signed in</p>
          <p className="font-medium">{admin?.email}</p>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
            href="/dashboard/system-status"
          >
            System status
          </Link>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void logout()}
          >
            Logout
          </Button>
        </nav>
      </Card>
      {children}
    </div>
  );
}
