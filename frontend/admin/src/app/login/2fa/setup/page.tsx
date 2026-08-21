"use client";

import { Button, ErrorState, Input, LoadingState } from "@setu/ui";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, type FormEvent } from "react";

import { AdminAuthShell } from "../../../../components/admin-auth-shell";
import { adminApi } from "../../../../lib/admin-api-client";

export default function AdminTwoFactorSetupPage() {
  const router = useRouter();
  const [setup, setSetup] = useState<{
    challengeToken: string;
    secret: string;
    otpauthUri: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const challengeToken = sessionStorage.getItem("setu_admin_challenge_token");
    if (!challengeToken) {
      setError("Your sign-in challenge has expired. Please sign in again.");
      return;
    }
    adminApi
      .startEnrollment(challengeToken)
      .then(setSetup)
      .catch((caught: unknown) =>
        setError(
          caught instanceof Error ? caught.message : "Unable to start setup",
        ),
      );
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setup) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.confirmEnrollment(
        setup.challengeToken,
        code,
      );
      sessionStorage.removeItem("setu_admin_challenge_token");
      sessionStorage.setItem("setu_admin_access_token", result.accessToken);
      setRecoveryCodes(result.recoveryCodes);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to enable two-factor authentication",
      );
    } finally {
      setLoading(false);
    }
  }

  if (recoveryCodes) {
    return (
      <AdminAuthShell
        description="Store these codes before continuing to the dashboard."
        eyebrow="Security setup"
        step="Complete"
        title="Save your recovery codes"
      >
        <p className="setu-admin-auth-note">
          These codes are shown once. Store them in a password manager before
          continuing.
        </p>
        <pre className="setu-admin-recovery-codes">
          {recoveryCodes.join("\n")}
        </pre>
        <Button
          className="mt-6 w-full"
          type="button"
          onClick={() => router.replace("/dashboard")}
        >
          Continue to dashboard
        </Button>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      description="Add this account to your authenticator app to protect the operations workspace."
      eyebrow="Security setup"
      step="Step 2 of 2"
      title="Set up two-factor authentication"
    >
      {setup ? (
        <>
          <p className="setu-admin-auth-note">
            Add this account to your authenticator app, then enter the code it
            displays.
          </p>
          <label className="setu-admin-auth-uri-label" htmlFor="otpauth-uri">
            Setup URI
          </label>
          <textarea
            id="otpauth-uri"
            className="setu-admin-auth-uri"
            readOnly
            value={setup.otpauthUri}
          />
          <p className="setu-admin-auth-key">
            Manual setup key: {setup.secret}
          </p>
          <form
            className="setu-admin-auth-form"
            onSubmit={(event) => void submit(event)}
          >
            <label className="setu-label" htmlFor="setup-code">
              Authenticator code
              <span aria-hidden="true" className="setu-required" />
            </label>
            <Input
              id="setup-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Enabling" : "Enable two-factor authentication"}
            </Button>
          </form>
        </>
      ) : !error ? (
        <LoadingState label="Preparing two-factor setup" />
      ) : null}
      {error ? (
        <div className="mt-4">
          <ErrorState title="Setup unavailable" detail={error} />
        </div>
      ) : null}
    </AdminAuthShell>
  );
}
