"use client";

import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
} from "@setu/ui";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

import { publicApi } from "../lib/api-client";

const tokenKey = "setu_public_access_token";

export function NotificationsPanel({ mode }: { mode: "user" | "vendor" }) {
  const [items, setItems] = useState<
    Array<{
      id: string;
      title: string;
      body: string;
      inquiryId?: string | null;
      readAt?: string | null;
      createdAt: string;
    }>
  >([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) {
      window.location.href = `/dev-auth?returnTo=${encodeURIComponent(mode === "vendor" ? "/vendor/notifications" : "/account/notifications")}`;
      return;
    }
    publicApi
      .notifications(token)
      .then((result) => {
        setItems(result.items);
        setUnread(result.unreadCount);
      })
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load notifications",
        ),
      )
      .finally(() => setLoading(false));
  }, [mode]);
  useEffect(() => {
    load();
  }, [load]);
  async function mark(id: string) {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) return;
    await publicApi.markNotificationRead(token, id);
    load();
  }
  async function markAll() {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) return;
    await publicApi.markAllNotificationsRead(token);
    load();
  }
  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="mt-2 text-slate-600">
            {unread} unread notification{unread === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="secondary" onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>
      {loading ? (
        <div className="mt-6">
          <LoadingState label="Loading notifications…" />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState title="Unable to load notifications" detail={error} />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.length === 0 ? (
            <p className="rounded border bg-white p-6 text-slate-600">
              No notifications.
            </p>
          ) : (
            items.map((item) => (
              <Card
                key={item.id}
                className={item.readAt ? "opacity-70" : "border-emerald-300"}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!item.readAt ? (
                    <Button variant="ghost" onClick={() => void mark(item.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
                {item.inquiryId ? (
                  <Link
                    className="mt-3 inline-block text-sm font-semibold underline"
                    href={`${mode === "vendor" ? "/vendor/inquiries" : "/account/inquiries"}/${item.inquiryId}`}
                  >
                    Open inquiry
                  </Link>
                ) : null}
              </Card>
            ))
          )}
        </div>
      )}
    </PageContainer>
  );
}
