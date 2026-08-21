import { PageContainer } from "@setu/ui";
import type { ReactNode } from "react";

import { ProtectedShell } from "./protected-shell";

export function AdminPageFrame({ children }: { children: ReactNode }) {
  return (
    <PageContainer>
      <ProtectedShell>{children}</ProtectedShell>
    </PageContainer>
  );
}
