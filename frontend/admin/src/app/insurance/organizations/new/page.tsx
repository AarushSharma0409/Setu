import { Card, PageContainer, PageHeader } from "@setu/ui";
import Link from "next/link";

import { ProtectedShell } from "../../../../components/protected-shell";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function NewInsuranceOrganizationPage() {
  return (
    <PageContainer>
      <ProtectedShell>
        <PageHeader
          eyebrow="Insurance organizations"
          title="Create draft organization"
          description="Creation remains permission-checked and cannot activate an organization."
        />
        <Card>
          <p className="font-semibold">
            Draft creation is intentionally controlled
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Complete regulatory identity, licensed lines, contact, licence, and
            document records through the protected API before submission. A
            dedicated form is the next operational refinement.
          </p>
          <Link
            className="mt-4 inline-block text-sm font-semibold text-violet-700 underline"
            href="/insurance/organizations"
          >
            Return to organizations
          </Link>
        </Card>
      </ProtectedShell>
    </PageContainer>
  );
}
