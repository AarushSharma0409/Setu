import { PageContainer } from "@setu/ui";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy notice | Setu",
  description: "How Setu handles account, inquiry, vendor, and platform data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageContainer className="mx-auto max-w-3xl py-12">
      <p className="setu-eyebrow">Privacy notice</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
        Your information on Setu
      </h1>
      <p className="mt-4 text-sm text-slate-500">
        Effective date: 21 August 2026
      </p>
      <div className="mt-8 space-y-8 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            What we collect
          </h2>
          <p className="mt-2 leading-7">
            We may collect account details, authentication and session records,
            vendor profile and verification documents, inquiries and messages,
            notification preferences, support communications, and technical
            request information needed to operate and secure Setu.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            How we use it
          </h2>
          <p className="mt-2 leading-7">
            We use information to provide discovery, authenticate accounts,
            review provider applications, deliver inquiries and notifications,
            prevent abuse, maintain security, troubleshoot the service, and meet
            legal obligations. We do not sell personal information.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            Provider connections
          </h2>
          <p className="mt-2 leading-7">
            Setu is a directory and connection platform. When you contact a
            provider, the inquiry and information you choose to share are used
            to facilitate that connection. The provider becomes responsible for
            its own subsequent handling of your information.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            Finance and insurance
          </h2>
          <p className="mt-2 leading-7">
            Setu does not sell, compare, price, issue, or advise on financial or
            insurance products. Finance and insurance listings are discovery
            categories that help you find and contact providers. Any service,
            advice, quote, application, or policy is provided by the selected
            provider, not Setu.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            Retention and security
          </h2>
          <p className="mt-2 leading-7">
            We retain information only as long as needed for the stated purpose,
            account administration, dispute handling, security, and legal
            requirements. We use access controls, encryption in transit, private
            document storage, short-lived signed links, logging, and malware
            scanning for vendor uploads.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Your choices</h2>
          <p className="mt-2 leading-7">
            You may request access, correction, deletion, or clarification by
            contacting support. Some records may need to be retained for
            security, fraud prevention, dispute resolution, or legal reasons.
          </p>
        </section>
      </div>
      <p className="mt-10 text-sm text-slate-600">
        Questions or requests?{" "}
        <Link className="text-violet-700 underline" href="/support">
          Contact support
        </Link>
        .
      </p>
    </PageContainer>
  );
}
