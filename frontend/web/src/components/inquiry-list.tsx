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
      window.location.href = `/auth?returnTo=${encodeURIComponent(base)}`;
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
    <PageContainer className="setu-inbox-page">
      <PageHeader
        eyebrow={mode === "vendor" ? "Vendor workspace" : "Your account"}
        title={mode === "vendor" ? "Lead inbox" : "Your conversations"}
        description={
          mode === "vendor"
            ? "Keep every customer conversation organised, friendly, and easy to follow."
            : "Your private conversations with approved Setu providers."
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
          <LoadingState label="Loading conversations..." />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState title="Unable to load conversations" detail={error} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description={
            mode === "vendor"
              ? "New customer inquiries will appear here when they reach your approved profile."
              : "When you contact an approved provider, your conversation will appear here."
          }
        />
      ) : (
        <section className="setu-inbox-list" aria-label="Conversations">
          <div className="setu-inbox-list-head">
            <div>
              <p className="setu-eyebrow">Conversation inbox</p>
              <h2>{items.length} active conversation{items.length === 1 ? "" : "s"}</h2>
            </div>
            <span>Open one to reply</span>
          </div>

          <div className="setu-inbox-grid">
            {items.map((item) => (
              <Link key={item.id} href={`${base}/${item.id}`}>
                <Card className="setu-inquiry-row setu-inbox-card">
                  <div className="setu-inbox-card-top">
                    <span className="setu-inbox-avatar" aria-hidden="true">
                      {mode === "vendor"
                        ? "C"
                        : item.vendor.businessName.slice(0, 1).toUpperCase()}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="setu-inbox-card-ref">{item.referenceNumber}</p>
                  <h3>{item.subject}</h3>
                  <p className="setu-inbox-card-person">
                    {mode === "vendor" ? "Customer inquiry" : item.vendor.businessName}
                  </p>
                  <div className="setu-inbox-card-foot">
                    <time dateTime={item.lastMessageAt}>
                      {new Date(item.lastMessageAt).toLocaleString()}
                    </time>
                    {item.unreadMessageCount > 0 ? (
                      <span>
                        {item.unreadMessageCount} new
                      </span>
                    ) : (
                      <span className="setu-inbox-open">Open chat</span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
