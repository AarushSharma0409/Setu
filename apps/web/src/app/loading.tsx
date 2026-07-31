import { LoadingState, PageContainer } from "@setu/ui";

export default function Loading() {
  return (
    <PageContainer>
      <LoadingState label="Preparing Setu" />
    </PageContainer>
  );
}
