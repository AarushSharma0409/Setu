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
import React, { useState, type FormEvent } from "react";

import { adminApi } from "../../../lib/admin-api-client";

export default function AdminTwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const challengeToken = sessionStorage.getItem("setu_admin_challenge_token");
    if (!challengeToken) {
      setError("Your sign-in challenge has expired. Please sign in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = recoveryMode
        ? await adminApi.verifyRecovery(challengeToken, code)
        : await adminApi.verifyTwoFactor(challengeToken, code);
      sessionStorage.removeItem("setu_admin_challenge_token");
      sessionStorage.setItem("setu_admin_access_token", result.accessToken);
      router.replace("/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Verification failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer className="grid min-h-screen place-items-center py-10">
      <PageHeader
        eyebrow="Multi-factor authentication"
        title="Verify your sign-in"
        description={
          recoveryMode
            ? "Enter one unused recovery code. Each code works once."
            : "Enter the six-digit code from your authenticator app."
        }
      />
      <Card className="w-full max-w-md">
        <p className="text-sm leading-6 text-slate-600">
          {recoveryMode
            ? "Enter one unused recovery code. Each code works once."
            : "Enter the six-digit code from your authenticator app."}
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => void submit(event)}
        >
          <FormField
            htmlFor="admin-otp"
            label={recoveryMode ? "Recovery code" : "Authenticator code"}
            required
          >
            <Input
              id="admin-otp"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode={recoveryMode ? "text" : "numeric"}
              autoComplete="one-time-code"
              placeholder={recoveryMode ? "xxxxxxxx-xxxxxxxx" : "123456"}
              required
            />
          </FormField>
          <Button loading={loading} type="submit">
            {loading ? "Checking" : "Continue"}
          </Button>
        </form>
        <button
          className="mt-4 text-sm font-medium text-slate-700 underline"
          type="button"
          onClick={() => setRecoveryMode((current) => !current)}
        >
          {recoveryMode ? "Use authenticator code" : "Use a recovery code"}
        </button>
        {error ? (
          <div className="mt-4">
            <ErrorState title="Verification failed" detail={error} />
          </div>
        ) : null}
      </Card>
    </PageContainer>
  );
}
