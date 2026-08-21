import { ErrorState } from "@setu/ui";
import Link from "next/link";

export function DiscoveryError() {
  return (
    <ErrorState
      title="Discovery is temporarily unavailable"
      detail={
        <Link href="/" className="underline">
          Return to Setu
        </Link>
      }
    />
  );
}
