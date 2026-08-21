"use client";

import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
  Reveal,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { publicApi } from "../lib/api-client";

export function InsuranceEntry() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const policyTypes = useQuery({
    queryKey: ["insurance-policy-types"],
    queryFn: publicApi.insurancePolicyTypes,
  });

  useEffect(() => {
    setAuthenticated(
      Boolean(sessionStorage.getItem("setu_public_access_token")),
    );
  }, []);

  function signInToStart() {
    router.push(`/auth?returnTo=${encodeURIComponent("/insurance")}`);
  }

  async function start(id: string) {
    const token = sessionStorage.getItem("setu_public_access_token");
    if (!token) {
      signInToStart();
      return;
    }
    try {
      const assessment = await publicApi.createInsuranceAssessment(token, id);
      router.push(`/insurance/needs/${assessment.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to start an assessment right now.",
      );
    }
  }
  return (
    <PageContainer>
      <main className="setu-insurance-page-stack mx-auto max-w-6xl py-8 sm:py-14">
        <section className="setu-insurance-hero">
          <div className="setu-insurance-hero-orb" />
          <Reveal className="max-w-2xl space-y-6">
            <p className="text-sm font-semibold text-violet-700">
              Setu Insurance
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Insurance choices, made easier to understand.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Start with your needs, explore the available options, and continue
              with an insurer only when you are ready. Setu does not promise
              approval or issue policies.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  document
                    .getElementById("policy-types")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore policy types
              </Button>
              <Link href="/insurance/dashboard">
                <Button variant="outline">Explore your journey</Button>
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              Private assessment · Clear disclosures · Transparent comparison
            </p>
          </Reveal>
          <Reveal className="mt-10 lg:mt-0" delay={90}>
            <div className="relative mx-auto max-w-md">
              <Card
                className="setu-insurance-journey-card relative z-10"
                elevation="raised-sm"
              >
                <div className="setu-insurance-journey-heading">
                  <div>
                    <p className="setu-insurance-journey-kicker">
                      A calmer path
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                      Your insurance journey
                    </p>
                  </div>
                  <span className="setu-insurance-journey-badge">
                    At your pace
                  </span>
                </div>
                <ol className="setu-insurance-journey-steps">
                  <li className="setu-insurance-journey-step">
                    <span className="setu-insurance-journey-index">01</span>
                    <span>
                      <strong>Start with what matters to you</strong>
                      <small>
                        A guided check-in helps you focus on the cover you are
                        looking for.
                      </small>
                    </span>
                  </li>
                  <li className="setu-insurance-journey-step">
                    <span className="setu-insurance-journey-index">02</span>
                    <span>
                      <strong>See the differences more clearly</strong>
                      <small>
                        Compare meaningful details such as cover, price, and
                        terms side by side.
                      </small>
                    </span>
                  </li>
                  <li className="setu-insurance-journey-step">
                    <span className="setu-insurance-journey-index">03</span>
                    <span>
                      <strong>Continue only when you are ready</strong>
                      <small>
                        Choose whether to continue with a provider after you
                        have reviewed the details.
                      </small>
                    </span>
                  </li>
                </ol>
                <p className="setu-insurance-journey-note">
                  No policy is issued through this page.
                </p>
              </Card>
              <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-3xl bg-sky-200/50 blur-2xl" />
            </div>
          </Reveal>
        </section>
        <section
          id="policy-types"
          className="setu-insurance-policy-types setu-insurance-choice-section"
          aria-labelledby="insurance-choice-title"
        >
          <Reveal>
            <div className="setu-insurance-choice-head">
              <div>
                <p className="setu-insurance-choice-kicker">Explore coverage</p>
                <h2 id="insurance-choice-title">Choose an insurance type.</h2>
                <p>
                  Begin with the kind of cover you want to understand. You can
                  review the journey before sharing any personal details.
                </p>
              </div>
              <div className="setu-insurance-choice-signal">
                <span className="setu-insurance-choice-signal-dot" />
                {policyTypes.data?.items.length
                  ? `${policyTypes.data.items.length} paths available`
                  : "Guided starting points"}
              </div>
            </div>
          </Reveal>
          {policyTypes.isLoading ? (
            <LoadingState label="Loading available insurance types" />
          ) : policyTypes.error ? (
            <ErrorState
              title="Insurance is not available"
              detail="This service has not been enabled yet."
            />
          ) : policyTypes.data?.items.length ? (
            <div className="setu-insurance-choice-grid">
              {policyTypes.data.items.map((type, index) => (
                <Reveal delay={index * 60} key={type.id}>
                  <Card className="setu-insurance-choice-card h-full">
                    <div className="setu-insurance-choice-card-top">
                      <span className="setu-insurance-choice-icon" aria-hidden="true">
                        {type.name.slice(0, 1)}
                      </span>
                      <span className="setu-insurance-choice-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <p className="setu-insurance-choice-status">
                        Available to explore
                      </p>
                      <h3>{type.name}</h3>
                      <p className="setu-insurance-choice-description">
                        {type.description ??
                          "Begin a private assessment to understand available cover options."}
                      </p>
                    </div>
                    <p className="setu-insurance-choice-note">
                      A private needs check-in comes before any quote request.
                    </p>
                    <Button
                      className="setu-insurance-choice-action"
                      onClick={() => void start(type.id)}
                    >
                      {authenticated ? "Start assessment" : "Sign in to start"}
                    </Button>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <ErrorState
              title="No policy types are available"
              detail="Check back when an approved insurance journey is enabled."
            />
          )}
        </section>
        <section className="setu-insurance-principles">
          <Reveal>
            <Card className="setu-insurance-principle">
              <h2 className="font-semibold">Understand before deciding</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Questions are grouped into manageable steps, with your progress
                saved as you go.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={60}>
            <Card className="setu-insurance-principle">
              <h2 className="font-semibold">Compare without pressure</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sort and compare available quotes using the details that matter
                to you.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={120}>
            <Card className="setu-insurance-principle">
              <h2 className="font-semibold">Stay in control</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Consent and disclosures are shown clearly before you submit an
                assessment.
              </p>
            </Card>
          </Reveal>
        </section>
        <section className="setu-insurance-explore-panel">
          <div className="setu-insurance-explore-copy">
            <p className="setu-insurance-explore-kicker">Explore mode</p>
            <h2>Take a look before you decide to begin.</h2>
            <p>
              You can understand the journey and browse available policy types
              without sharing personal details.
            </p>
          </div>
          <div
            className="setu-insurance-explore-rules"
            aria-label="Access guide"
          >
            <div>
              <span aria-hidden="true">⌕</span>
              <strong>Browse freely</strong>
              <small>
                Read the journey and explore available policy types.
              </small>
            </div>
            <div>
              <span aria-hidden="true">↗</span>
              <strong>Sign in only to act</strong>
              <small>
                Save an assessment, compare quotes, or continue with a provider.
              </small>
            </div>
          </div>
          <div className="setu-insurance-explore-actions">
            <Link
              className="setu-button setu-button-outline setu-button-md"
              href="/insurance/dashboard"
            >
              View overview
            </Link>
            {!authenticated ? (
              <Button onClick={signInToStart}>Sign in when ready</Button>
            ) : null}
          </div>
        </section>
        {error ? (
          <div className="setu-alert setu-alert-danger" role="alert">
            {error}
          </div>
        ) : null}
      </main>
    </PageContainer>
  );
}
