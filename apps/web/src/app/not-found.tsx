import { PageContainer } from "@setu/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-slate-600">
        The page you requested is not available.
      </p>
      <Link href="/" className="mt-6 inline-block font-semibold underline">
        Return to Setu
      </Link>
    </PageContainer>
  );
}
