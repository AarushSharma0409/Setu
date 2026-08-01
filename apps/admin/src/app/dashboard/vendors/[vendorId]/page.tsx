"use client";

import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageContainer,
} from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ProtectedShell } from "../../../../components/protected-shell";
import { adminApi } from "../../../../lib/admin-api-client";

export default function AdminVendorDetailPage() {
  const params = useParams<{ vendorId: string }>();
  const token =
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem("setu_admin_access_token");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    enabled: Boolean(token && params.vendorId),
    queryKey: ["admin-vendor", params.vendorId],
    queryFn: () => adminApi.vendorDetail(token ?? "", params.vendorId),
  });

  async function decide(action: "approve" | "reject" | "suspend") {
    if (!token || !query.data) return;
    if (
      (action === "reject" || action === "suspend") &&
      reason.trim().length < 10
    ) {
      setError(
        "Please provide at least 10 characters explaining this decision.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated =
        action === "approve"
          ? await adminApi.approveVendor(token, query.data.id)
          : action === "reject"
            ? await adminApi.rejectVendor(token, query.data.id, reason)
            : await adminApi.suspendVendor(token, query.data.id, reason);
      void query.refetch();
      void updated;
      setReason("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The decision could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <ProtectedShell>
        {query.isLoading ? (
          <LoadingState label="Loading vendor application" />
        ) : null}
        {query.isError ? (
          <ErrorState
            title="Vendor unavailable"
            detail="The vendor may have been removed or your session may have expired."
          />
        ) : null}
        {query.data ? (
          <>
            <Card>
              <h1 className="text-2xl font-semibold">
                {query.data.businessName ?? "Unnamed vendor"}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Status: {query.data.status}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Owner: {query.data.owner.email}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {query.data.description ?? "No description provided."}
              </p>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold">
                Categories and service areas
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Categories:{" "}
                {query.data.categories
                  .map((category) => category.name)
                  .join(", ") || "—"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Service areas: {query.data.serviceAreas.length || 0}
              </p>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold">Documents</h2>
              <div className="mt-3 space-y-2">
                {query.data.documents.map((document) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 p-3"
                    key={document.id}
                  >
                    <span className="text-sm">
                      {document.originalFileName} · {document.status}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (!token) return;
                        void adminApi
                          .documentAccess(token, query.data.id, document.id)
                          .then((result) =>
                            window.open(
                              result.url,
                              "_blank",
                              "noopener,noreferrer",
                            ),
                          )
                          .catch((caught: unknown) =>
                            setError(
                              caught instanceof Error
                                ? caught.message
                                : "Document access failed",
                            ),
                          );
                      }}
                    >
                      Open securely
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
            {query.data.status === "PENDING_REVIEW" ||
            query.data.status === "APPROVED" ? (
              <Card>
                <h2 className="text-lg font-semibold">Decision</h2>
                <label
                  className="mt-3 block text-sm font-medium"
                  htmlFor="decision-reason"
                >
                  Reason or internal note
                </label>
                <Input
                  id="decision-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain the decision (10+ characters for rejection or suspension)"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  {query.data.status === "PENDING_REVIEW" ? (
                    <>
                      <Button
                        disabled={busy}
                        type="button"
                        onClick={() => void decide("approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={busy}
                        variant="secondary"
                        type="button"
                        onClick={() => void decide("reject")}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {query.data.status === "APPROVED" ? (
                    <Button
                      disabled={busy}
                      variant="secondary"
                      type="button"
                      onClick={() => void decide("suspend")}
                    >
                      Suspend
                    </Button>
                  ) : null}
                </div>
                {error ? (
                  <div className="mt-4">
                    <ErrorState title="Decision failed" detail={error} />
                  </div>
                ) : null}
              </Card>
            ) : null}
          </>
        ) : null}
      </ProtectedShell>
    </PageContainer>
  );
}
