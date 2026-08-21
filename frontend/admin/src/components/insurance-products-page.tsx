import { PageContainer, PageHeader } from "@setu/ui";

import { InsuranceProductsWorkspace } from "./insurance-products-workspace";
import { ProtectedShell } from "./protected-shell";

export function InsuranceProductsPage({
  productId,
  create,
}: {
  productId?: string;
  create?: boolean;
}) {
  return (
    <PageContainer>
      <ProtectedShell>
        <PageHeader
          eyebrow="Insurance administration"
          title={
            create
              ? "Create insurance product"
              : productId
                ? "Insurance product"
                : "Insurance product catalogue"
          }
          description="Private, versioned insurer product configuration. This is not a customer quote or premium-calculation surface."
        />
        <InsuranceProductsWorkspace productId={productId} create={create} />
      </ProtectedShell>
    </PageContainer>
  );
}
