"use client";

import { Button, ErrorState, FormField, Input } from "@setu/ui";
import { useRouter } from "next/navigation";
import React from "react";
import { useState, type FormEvent } from "react";

import { AdminAuthShell } from "../../components/admin-auth-shell";
import { adminApi } from "../../lib/admin-api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const isLocal = process.env.NODE_ENV !== "production";
  const [email, setEmail] = useState(isLocal ? "admin.local@setu.test" : "");
  const [password, setPassword] = useState(
    isLocal ? "change-me-local-admin-password" : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await adminApi.login({ email, password });

      if ("challengeToken" in result) {
        sessionStorage.setItem(
          "setu_admin_challenge_token",
          result.challengeToken,
        );
        router.replace(
          result.nextStep === "TOTP_ENROLLMENT_REQUIRED"
            ? "/login/2fa/setup"
            : "/login/2fa",
        );
        return;
      }

      sessionStorage.setItem("setu_admin_access_token", result.accessToken);
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      description="Secure access for vendor verification and platform operations."
      eyebrow="Restricted workspace"
      step="Step 1 of 2"
      title="Setu operations"
    >
      <p className="setu-admin-auth-note">
        {isLocal
          ? "Use the seeded development administrator to continue."
          : "Use the administrator credentials provided by your system owner."}
      </p>
      <form
        className="setu-admin-auth-form"
        onSubmit={(event) => void submit(event)}
      >
        <FormField htmlFor="admin-email" label="Admin email" required>
          <Input
            id="admin-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin.local@setu.test"
            type="email"
            autoComplete="email"
            required
          />
        </FormField>
        <FormField htmlFor="admin-password" label="Password" required>
          <Input
            id="admin-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            required
          />
        </FormField>
        <Button className="w-full" loading={loading} type="submit">
          {loading ? "Signing in" : "Sign in"}
        </Button>
      </form>
      {error ? (
        <div className="mt-4">
          <ErrorState title="Authentication needed" detail={error} />
        </div>
      ) : null}
    </AdminAuthShell>
  );
}
