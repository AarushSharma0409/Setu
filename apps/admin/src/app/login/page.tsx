"use client";

import {
  Button,
  Card,
  ErrorState,
  FormField,
  Input,
  PageContainer,
  PageHeader,
} from "@setu/ui";
import { useRouter } from "next/navigation";
import React from "react";
import { useState, type FormEvent } from "react";

import { adminApi } from "../../lib/admin-api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin.local@setu.test");
  const [password, setPassword] = useState("change-me-local-admin-password");
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
    <PageContainer className="grid min-h-screen place-items-center py-10">
      <PageHeader
        eyebrow="Restricted workspace"
        title="Setu operations"
        description="Secure access for vendor verification and platform operations."
      />
      <Card className="w-full max-w-md">
        <p className="text-sm leading-6 text-slate-600">
          Internal administration sign-in for local development.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => void submit(event)}
        >
          <FormField htmlFor="admin-email" label="Admin email" required>
            <Input
              id="admin-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin.local@setu.test"
              type="email"
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
              required
            />
          </FormField>
          <Button loading={loading} type="submit">
            {loading ? "Signing in" : "Sign in"}
          </Button>
        </form>
        {error ? (
          <div className="mt-4">
            <ErrorState title="Authentication needed" detail={error} />
          </div>
        ) : null}
      </Card>
    </PageContainer>
  );
}
