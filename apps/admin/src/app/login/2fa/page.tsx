"use client";

import { Button, ErrorState, FormField, Input } from "@setu/ui";
import { useRouter } from "next/navigation";
import React, { useState, type FormEvent } from "react";

import { AdminAuthShell } from "../../../components/admin-auth-shell";
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
    <AdminAuthShell
      description={
        recoveryMode
          ? "Enter one unused recovery code. Each code works once."
          : "Enter the six-digit code from your authenticator app."
      }
      eyebrow="Multi-factor authentication"
      step="Step 2 of 2"
      title="Verify your sign-in"
    >
      <p className="setu-admin-auth-note">
        {recoveryMode
          ? "Enter one unused recovery code. Each code works once."
          : "Enter the six-digit code from your authenticator app."}
      </p>
      <form
        className="setu-admin-auth-form"
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
        <Button className="w-full" loading={loading} type="submit">
          {loading ? "Checking" : "Continue"}
        </Button>
      </form>
      <button
        className="setu-admin-auth-switch"
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
    </AdminAuthShell>
  );
}
