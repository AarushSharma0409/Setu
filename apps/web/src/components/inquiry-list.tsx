"use client";

import type { InquiryListItem } from "@setu/types";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  StatusBadge,
} from "@setu/ui";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { publicApi } from "../lib/api-client";

const tokenKey = "setu_public_access_token";

export function InquiryList({ mode }: { mode: "user" | "vendor" }) {
  const [items, setItems] = useState<InquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const base = mode === "vendor" ? "/vendor/inquiries" : "/account/inquiries";
  useEffect(() => {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) {
      window.location.href = `/dev-auth?returnTo=${encodeURIComponent(base)}`;
      return;
    }
    (mode === "vendor"
      ? publicApi.vendorInquiries(token)
      : publicApi.inquiries(token)
    )
      .then((result) => setItems(result.items))
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Could not load inquiries",
        ),
      )
      .finally(() => setLoading(false));
  }, [base, mode]);
  return (
    <PageContainer>
      <PageHeader
        eyebrow={mode === "vendor" ? "Vendor workspace" : "Your account"}
        title={mode === "vendor" ? "Lead inbox" : "My inquiries"}
        description={
          mode === "vendor"
            ? "Private inquiries sent to your approved vendor profile."
            : "Your private conversations with approved providers."
        }
        actions={
          <Link
            className="setu-button setu-button-secondary setu-button-md"
            href={
              mode === "vendor"
                ? "/vendor/notifications"
                : "/account/notifications"
            }
          >
            Notifications
          </Link>
        }
      />
      {loading ? (
        <div className="mt-6">
          <LoadingState label="Loading inquiries…" />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState title="Unable to load inquiries" detail={error} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No inquiries yet"
          description={
            mode === "vendor"
              ? "New inquiries from customers will appear here."
              : "When you contact an approved provider, your conversation will appear here."
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`${base}/${item.id}`}>
              <Card className="setu-card-interactive setu-inquiry-row">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.referenceNumber}
                    </p>
                    <h2 className="mt-1 font-semibold">{item.subject}</h2>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {mode === "vendor"
                    ? "Customer inquiry"
                    : item.vendor.businessName}{" "}
                  · {new Date(item.lastMessageAt).toLocaleString()}
                </p>
                {item.unreadMessageCount > 0 ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    {item.unreadMessageCount} unread message
                    {item.unreadMessageCount === 1 ? "" : "s"}
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
