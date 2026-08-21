import { PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use | Setu",
  description: "Terms for using the Setu provider directory and platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PageContainer className="mx-auto max-w-3xl py-12">
      <p className="setu-eyebrow">Terms of use</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
        Using Setu
      </h1>
      <p className="mt-4 text-sm text-slate-500">
        Effective date: 21 August 2026
      </p>
      <div className="mt-8 space-y-8 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-950">The service</h2>
          <p className="mt-2 leading-7">
            Setu provides a directory for discovering approved service providers
            by category and location, plus tools for users and providers to
            communicate. Approval means that a provider completed Setu's review
            process; it is not a guarantee of quality, availability, price, or
            outcome.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            Your responsibility
          </h2>
          <p className="mt-2 leading-7">
            Keep account credentials secure, provide accurate information, use
            the platform lawfully, and independently evaluate providers before
            engaging them. Do not upload malware, unlawful material, or
            documents that you are not authorized to share.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            Finance and insurance boundary
          </h2>
          <p className="mt-2 leading-7">
            Finance and insurance categories are referral and discovery only.
            Setu is not an insurer, broker, adviser, quote engine, comparison
            service, payment platform, or policy issuer. Setu does not recommend
            a financial or insurance product. Users are connected to the
            provider they choose, and the provider is responsible for its own
            services, disclosures, advice, applications, pricing, and contracts.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            Provider relationships
          </h2>
          <p className="mt-2 leading-7">
            A provider relationship is formed directly between the user and the
            provider. Setu is not a party to the provider's service contract and
            cannot guarantee a response, appointment, eligibility, approval, or
            result.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            Suspension and changes
          </h2>
          <p className="mt-2 leading-7">
            We may suspend accounts, remove listings, or restrict features to
            protect users, providers, or the platform. We may update these terms
            as the service changes; material updates will be communicated
            through the platform where appropriate.
          </p>
        </section>
      </div>
      <p className="mt-10 text-sm text-slate-600">
        Questions?{" "}
        <Link className="text-violet-700 underline" href="/support">
          Contact support
        </Link>
        .
      </p>
    </PageContainer>
  );
}
