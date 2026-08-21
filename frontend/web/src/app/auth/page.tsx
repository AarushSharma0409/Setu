"use client";

import { Button, ErrorState, FormField, Input, PageContainer } from "@setu/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { publicApi, type PublicUser } from "../../lib/api-client";
import { webEnv } from "../../lib/env";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const isCreateAccount = searchParams.get("intent") === "signup";
  const mode = searchParams.get("mode");
  const resetToken = searchParams.get("token") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const googleButton = useRef<HTMLDivElement>(null);
  const isForgotPassword = mode === "forgot";
  const isResetPassword = mode === "reset";

  useEffect(() => {
    if (window.google) setGisReady(true);
  }, []);

  const signInWithGoogle = useCallback(
    async (credential: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await publicApi.googleIdToken(credential);
        sessionStorage.setItem("setu_public_access_token", result.accessToken);
        window.location.assign(safeReturnTo(searchParams.get("returnTo")));
      } catch {
        setError("Google sign-in could not be completed. Please try again.");
        setLoading(false);
      }
    },
    [searchParams],
  );

  useEffect(() => {
    const clientId = webEnv.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    if (!gisReady || !clientId || !googleButton.current || !window.google)
      return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => void signInWithGoogle(response.credential),
    });
    googleButton.current.replaceChildren();
    window.google.accounts.id.renderButton(googleButton.current, {
      shape: "rectangular",
      size: "large",
      text: isCreateAccount ? "signup_with" : "signin_with",
      theme: "outline",
      width: 360,
    });
  }, [gisReady, isCreateAccount, signInWithGoogle]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (isForgotPassword) {
        const result = await publicApi.requestPasswordReset(email);
        setNotice(result.message);
        return;
      }
      if (isResetPassword) {
        await publicApi.resetPassword(resetToken, password);
        window.location.assign("/auth?reset=success");
        return;
      }
      const result = isCreateAccount
        ? await publicApi.register({
            name,
            password,
            email,
          })
        : await publicApi.login({ identifier: email, password });
      sessionStorage.setItem("setu_public_access_token", result.accessToken);
      setUser(result.user);
      window.location.assign(safeReturnTo(searchParams.get("returnTo")));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not complete your request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const title = isForgotPassword
    ? "Reset your password"
    : isResetPassword
      ? "Choose a new password"
      : isCreateAccount
        ? "Create your account"
        : "Sign in";

  return (
    <PageContainer className="setu-auth-page">
      <section className="setu-auth-shell">
        <div className="setu-auth-story">
          <Link className="setu-auth-home-link" href="/">
            <span aria-hidden="true">&larr;</span> Back to Setu
          </Link>
          <div>
            <p className="setu-auth-kicker">Your local Setu space</p>
            <h1>
              {isCreateAccount
                ? "Start exploring with confidence."
                : "Welcome back to your Setu."}
            </h1>
            <p>
              Discover trusted services, manage inquiries, and register your
              business from one clear workspace.
            </p>
          </div>
          <div className="setu-auth-story-grid" aria-hidden="true">
            <div>
              <span>01</span>
              <strong>Discover</strong>
              <small>Explore services before you commit.</small>
            </div>
            <div>
              <span>02</span>
              <strong>Connect</strong>
              <small>Keep every inquiry in one place.</small>
            </div>
            <div>
              <span>03</span>
              <strong>Grow</strong>
              <small>Register your business when ready.</small>
            </div>
          </div>
        </div>
        <div className="setu-auth-panel">
          <div className="setu-auth-panel-topline">
            <span>Setu account</span>
            <span className="setu-auth-status">Secure access</span>
          </div>
          {!isForgotPassword && !isResetPassword ? (
            <div className="setu-auth-mode-tabs" aria-label="Account action">
              <Link
                className={!isCreateAccount ? "is-active" : ""}
                href="/auth"
              >
                Sign in
              </Link>
              <Link
                className={isCreateAccount ? "is-active" : ""}
                href="/auth?intent=signup"
              >
                Create account
              </Link>
            </div>
          ) : null}
          <h2>{title}</h2>
          <p className="setu-auth-panel-description">
            {isForgotPassword
              ? "Enter your email and we will send a secure reset link if an account exists."
              : isResetPassword
                ? "Use at least eight characters. This link can only be used once."
                : isCreateAccount
                  ? "Use your email address to create a Setu account."
                  : "Sign in using the email address linked to your account."}
          </p>
          {!isForgotPassword && !isResetPassword ? (
            webEnv.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ? (
              <>
                <Script
                  src="https://accounts.google.com/gsi/client"
                  onError={() =>
                    setError(
                      "Google sign-in could not load. Check your connection or browser extensions and retry.",
                    )
                  }
                  onLoad={() => setGisReady(true)}
                  onReady={() => setGisReady(true)}
                  strategy="afterInteractive"
                />
                <div className="setu-google-auth" ref={googleButton} />
              </>
            ) : (
              <p className="setu-google-setup-note">
                Google sign-in will appear here after its Client ID is
                configured.
              </p>
            )
          ) : null}
          {!isForgotPassword && !isResetPassword ? (
            <div className="setu-auth-divider">
              <span>or continue with</span>
            </div>
          ) : null}
          <form
            className="setu-auth-form"
            onSubmit={(event) => void submit(event)}
          >
            {isCreateAccount ? (
              <FormField htmlFor="name" label="Your name" required>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  required
                />
              </FormField>
            ) : null}
            {isForgotPassword || !isResetPassword ? (
              <FormField htmlFor="email" label="Email address" required>
                <Input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  required
                />
              </FormField>
            ) : null}
            {!isForgotPassword ? (
              <FormField
                htmlFor="password"
                label={isResetPassword ? "New password" : "Password"}
                required
              >
                <Input
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                  minLength={8}
                  required
                />
              </FormField>
            ) : null}
            {!isCreateAccount &&
            !isForgotPassword &&
            !isResetPassword ? (
              <Link className="setu-forgot-password" href="/auth?mode=forgot">
                Forgot password?
              </Link>
            ) : null}
            <Button className="w-full" loading={loading} type="submit">
              {loading
                ? "Please wait"
                : isForgotPassword
                  ? "Send reset link"
                  : isResetPassword
                    ? "Reset password"
                    : isCreateAccount
                      ? "Create account"
                      : "Sign in to Setu"}
            </Button>
          </form>
          {notice ? <p className="setu-auth-success">{notice}</p> : null}
          {searchParams.get("reset") === "success" ? (
            <p className="setu-auth-success">
              Password updated. You can now sign in.
            </p>
          ) : null}
          {user ? (
            <p className="setu-auth-success">
              Signed in as {user.email ?? user.phone}
            </p>
          ) : null}
          {error ? (
            <div className="mt-4">
              <ErrorState title="Account access failed" detail={error} />
            </div>
          ) : null}
          {isForgotPassword || isResetPassword ? (
            <Link className="setu-forgot-password" href="/auth">
              Back to sign in
            </Link>
          ) : null}
          <p className="setu-auth-legal">
            By continuing, you agree to use Setu responsibly and keep your
            account details private.
          </p>
        </div>
      </section>
    </PageContainer>
  );
}

function safeReturnTo(returnTo: string | null): string {
  return returnTo?.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : "/";
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (configuration: {
            callback: (response: { credential: string }) => void;
            client_id: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              shape: "rectangular";
              size: "large";
              text: "signin_with" | "signup_with";
              theme: "outline";
              width: number;
            },
          ) => void;
        };
      };
    };
  }
}
