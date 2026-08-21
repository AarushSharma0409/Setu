import { PageContainer, PageHeader } from "@setu/ui";

import { type InsuranceView, InsuranceWorkspace } from "./insurance-workspace";
import { ProtectedShell } from "./protected-shell";

const headings: Record<InsuranceView, { title: string; description: string }> =
  {
    dashboard: {
      title: "Insurance foundation",
      description:
        "Private, configuration-only operations for the licensed insurance workstream.",
    },
    "operating-model": {
      title: "Operating model",
      description:
        "Draft, activate, and retain immutable licensed operating-model versions.",
    },
    organizations: {
      title: "Insurance organizations",
      description:
        "Private insurer and intermediary regulatory records, separate from marketplace vendors.",
    },
    "policy-types": {
      title: "Policy-type configuration",
      description:
        "Controlled internal configuration. No insurance products or quotations are created here.",
    },
    disclosures: {
      title: "Disclosure templates",
      description:
        "Versioned, reviewable disclosures with immutable published versions.",
    },
    "consent-templates": {
      title: "Consent templates",
      description:
        "Purpose-specific consent configuration. No customer consent capture is enabled.",
    },
    "audit-logs": {
      title: "Insurance audit history",
      description:
        "High-value insurance configuration and access events are retained for review.",
    },
    "organization-detail": {
      title: "Organization review",
      description:
        "Identity, licences, documents, members, and controlled decisions.",
    },
    "disclosure-detail": {
      title: "Disclosure version",
      description:
        "Published content is read-only; changes require a new version.",
    },
    "consent-template-detail": {
      title: "Consent-template version",
      description: "Published versions are immutable and purpose-specific.",
    },
  };

export function InsurancePage({
  view,
  id,
}: {
  view: InsuranceView;
  id?: string;
}) {
  const heading = headings[view];
  return (
    <PageContainer>
      <ProtectedShell>
        <PageHeader
          eyebrow="Insurance administration"
          title={heading.title}
          description={heading.description}
        />
        <InsuranceWorkspace view={view} id={id} />
      </ProtectedShell>
    </PageContainer>
  );
}
