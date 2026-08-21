import { Card, PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";

import { webEnv } from "../../lib/env";

export const metadata: Metadata = {
  title: "Support and contact | Setu",
  description: "Contact Setu about accounts, provider listings, and inquiries.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <PageContainer className="mx-auto max-w-3xl py-12">
      <p className="setu-eyebrow">Support</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
        We can help with the Setu journey.
      </h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Contact us about account access, provider listings, vendor onboarding,
        inquiries, or a privacy request. Setu support does not provide
        financial, insurance, legal, tax, or investment advice.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-semibold">General support</h2>
          {webEnv.NEXT_PUBLIC_SUPPORT_EMAIL ? (
            <a
              className="text-violet-700 underline"
              href={`mailto:${webEnv.NEXT_PUBLIC_SUPPORT_EMAIL}`}
            >
              {webEnv.NEXT_PUBLIC_SUPPORT_EMAIL}
            </a>
          ) : (
            <p className="text-sm text-slate-500">
              Support email is being configured.
            </p>
          )}
          {webEnv.NEXT_PUBLIC_SUPPORT_PHONE ? (
            <a
              className="block text-violet-700 underline"
              href={`tel:${webEnv.NEXT_PUBLIC_SUPPORT_PHONE}`}
            >
              {webEnv.NEXT_PUBLIC_SUPPORT_PHONE}
            </a>
          ) : null}
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold">Privacy requests</h2>
          <p className="text-sm leading-6 text-slate-600">
            Use the support contact to request access, correction, deletion, or
            clarification about personal information held by Setu.
          </p>
          <Link className="text-violet-700 underline" href="/privacy">
            Read the privacy notice
          </Link>
        </Card>
      </div>
      <Card className="mt-6 space-y-3">
        <h2 className="font-semibold">What to include</h2>
        <p className="text-sm leading-6 text-slate-600">
          Include your Setu account email, vendor or inquiry reference, the
          relevant page, and a short description. Never send passwords, OTPs,
          payment credentials, or identity documents by email unless Setu
          support specifically directs you through a secure channel.
        </p>
      </Card>
    </PageContainer>
  );
}
