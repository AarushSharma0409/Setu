"use client";

import {
  Button,
  Card,
  ErrorState,
  FormField,
  PageContainer,
  PageHeader,
  Input,
} from "@setu/ui";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { publicApi, type PublicUser } from "../../lib/api-client";

export default function DevAuthPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("dev.user@setu.test");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await publicApi.devLogin({
        email,
        name: "Development User",
      });
      sessionStorage.setItem("setu_public_access_token", result.accessToken);
      setUser(result.user);
      const returnTo = searchParams.get("returnTo");
      if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
        window.location.assign(returnTo);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Development login failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Local development"
        title="Sign in to Setu"
        description="Use a development account to test inquiries, onboarding, and vendor workspace flows."
      />
      <Card className="mx-auto max-w-lg">
        <p className="text-sm leading-6 text-slate-600">
          This control calls the non-production API endpoint and stores only the
          short-lived access token in session storage.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => void submit(event)}
        >
          <FormField
            htmlFor="dev-email"
            label="Email or development account"
            required
          >
            <Input
              id="dev-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="dev.user@setu.test"
              type="email"
              required
            />
          </FormField>
          <Button loading={loading} type="submit">
            {loading ? "Signing in" : "Sign in as dev user"}
          </Button>
        </form>
        {error ? (
          <div className="mt-4">
            <ErrorState title="Login failed" detail={error} />
          </div>
        ) : null}
        {user ? (
          <p className="mt-4 text-sm text-emerald-700">
            Signed in as {user.email ?? user.phone}
          </p>
        ) : null}
      </Card>
    </PageContainer>
  );
}
