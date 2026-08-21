import type { PublicPagination } from "@setu/types";
import Link from "next/link";

export function Pagination({
  pagination,
  pathname,
  params,
}: {
  pagination: PublicPagination;
  pathname: string;
  params?: Record<string, string | undefined>;
}) {
  if (pagination.totalPages <= 1) return null;
  const href = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {}))
      if (value) query.set(key, value);
    query.set("page", String(page));
    return `${pathname}?${query.toString()}`;
  };
  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between text-sm"
    >
      {pagination.hasPreviousPage ? (
        <Link
          href={href(pagination.page - 1)}
          className="rounded border px-3 py-2 hover:bg-slate-50"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-slate-500">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      {pagination.hasNextPage ? (
        <Link
          href={href(pagination.page + 1)}
          className="rounded border px-3 py-2 hover:bg-slate-50"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
