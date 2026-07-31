import { Button, Card, PageContainer } from "@setu/ui";
import Link from "next/link";
import React from "react";

import { ApiStatus } from "../components/api-status";

export default function HomePage() {
  return (
    <PageContainer className="space-y-8">
      <header className="grid gap-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Sprint 1 foundation
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950 sm:text-5xl">
            Setu
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            A PAN-India multi-category vendor directory platform. This first
            screen keeps the product surface honest: infrastructure, health
            checks, and auth foundations before marketplace workflows arrive.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled>Service search soon</Button>
            <Link href="/vendor/onboarding">
              <Button variant="secondary">Vendor onboarding</Button>
            </Link>
            <Link
              className="inline-flex min-h-10 items-center rounded-md px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
              href="/dev-auth"
            >
              Dev auth
            </Link>
          </div>
        </div>
        <ApiStatus />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Public app</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Next.js App Router, shared UI primitives, typed API client, and
            health status.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">API foundation</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            NestJS, Prisma, Redis, validation, structured errors, and
            authentication boundaries.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Future flows</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Inquiry, reviews, subscriptions, insurance, and marketplace search
            remain intentionally outside the current onboarding foundation.
          </p>
        </Card>
      </section>
    </PageContainer>
  );
}
