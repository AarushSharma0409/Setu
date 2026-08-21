"use client";

import { Button, ErrorState, PageContainer } from "@setu/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageContainer>
      <ErrorState
        title="Setu could not load this page"
        detail="Please try again."
      />
      <Button className="mt-4" onClick={reset}>
        Retry
      </Button>
    </PageContainer>
  );
}
