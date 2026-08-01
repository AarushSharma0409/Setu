"use client";

import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageContainer,
} from "@setu/ui";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, type FormEvent } from "react";

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
      <PageContainer className="grid min-h-screen place-items-center py-10">
        <Card className="w-full max-w-lg">
          <h1 className="text-2xl font-semibold">Save your recovery codes</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These codes are shown once. Store them in a password manager before
            continuing.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-white">
            {recoveryCodes.join("\n")}
          </pre>
          <Button
            className="mt-6"
            type="button"
            onClick={() => router.replace("/dashboard")}
          >
            Continue to dashboard
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="grid min-h-screen place-items-center py-10">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold">
          Set up two-factor authentication
        </h1>
        {setup ? (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add this account to your authenticator app, then enter the code it
              displays.
            </p>
            <label
              className="mt-5 block text-sm font-medium text-slate-700"
              htmlFor="otpauth-uri"
            >
              Setup URI
            </label>
            <textarea
              id="otpauth-uri"
              className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-xs"
              readOnly
              value={setup.otpauthUri}
            />
            <p className="mt-3 text-xs text-slate-500">
              Manual setup key: {setup.secret}
            </p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => void submit(event)}
            >
              <label
                className="block text-sm font-medium text-slate-700"
                htmlFor="setup-code"
              >
                Authenticator code
              </label>
              <Input
                id="setup-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
              />
              <Button disabled={loading} type="submit">
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
      </Card>
    </PageContainer>
  );
}
