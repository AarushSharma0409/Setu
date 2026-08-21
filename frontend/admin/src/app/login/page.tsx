"use client";

import { Button, ErrorState, FormField, Input } from "@setu/ui";
import { useRouter } from "next/navigation";
import React from "react";
import { useCallback, useState, type FormEvent } from "react";

import { AdminAuthShell } from "../../components/admin-auth-shell";
import { adminApi } from "../../lib/admin-api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const continueToSecondFactor = useCallback(
    (result: {
      challengeToken: string;
      nextStep: "TOTP_REQUIRED" | "TOTP_ENROLLMENT_REQUIRED";
    }) => {
      sessionStorage.setItem(
        "setu_admin_challenge_token",
        result.challengeToken,
      );
      router.replace(
        result.nextStep === "TOTP_ENROLLMENT_REQUIRED"
          ? "/login/2fa/setup"
          : "/login/2fa",
      );
    },
    [router],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await adminApi.login({ email, password });

      if ("challengeToken" in result) {
        continueToSecondFactor(result);
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
      description="Use your administrator email and password, then verify with your authenticator app."
      eyebrow="Restricted workspace"
      step="Step 1 of 2"
      title="Setu operations"
    >
      <p className="setu-admin-auth-note">
        Use the administrator credentials provided by your system owner. Every
        sign-in requires a separate authenticator-app code.
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
            placeholder="admin@yourdomain.com"
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
