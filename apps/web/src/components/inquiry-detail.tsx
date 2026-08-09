"use client";

import type { InquiryDetailContract } from "@setu/types";
import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageContainer,
  StatusBadge,
} from "@setu/ui";
import Link from "next/link";
import React, { useCallback, useEffect, useState, type FormEvent } from "react";

import { publicApi } from "../lib/api-client";

const tokenKey = "setu_public_access_token";

export function InquiryDetail({
  id,
  mode,
}: {
  id: string;
  mode: "user" | "vendor";
}) {
  const [inquiry, setInquiry] = useState<InquiryDetailContract | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [working, setWorking] = useState(false);
  const base = mode === "vendor" ? "/vendor/inquiries" : "/account/inquiries";
  const load = useCallback(() => {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) {
      window.location.href = `/dev-auth?returnTo=${encodeURIComponent(`${base}/${id}`)}`;
      return;
    }
    (mode === "vendor"
      ? publicApi.vendorInquiry(token, id)
      : publicApi.inquiry(token, id)
    )
      .then((result) => setInquiry(result.inquiry))
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Could not load inquiry",
        ),
      )
      .finally(() => setLoading(false));
  }, [base, id, mode]);
  useEffect(() => {
    load();
  }, [load]);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem(tokenKey);
    if (!token) return;
    setSending(true);
    setError(null);
    try {
      if (mode === "vendor")
        await publicApi.sendVendorInquiryMessage(token, id, body);
      else await publicApi.sendInquiryMessage(token, id, body);
      setBody("");
      load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Message could not be sent",
      );
    } finally {
      setSending(false);
    }
  }
  async function action(kind: "withdraw" | "close") {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) return;
    setWorking(true);
    try {
      if (kind === "withdraw")
        await publicApi.withdrawInquiry(token, id, "Withdrawn by user");
      else await publicApi.closeInquiry(token, id, "Closed by user");
      load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Action could not be completed",
      );
    } finally {
      setWorking(false);
    }
  }
  async function updateStatus(status: string) {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) return;
    setWorking(true);
    try {
      await publicApi.updateInquiryStatus(
        token,
        id,
        status,
        status === "CLOSED" ? "Closed by vendor" : undefined,
      );
      load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Status update failed",
      );
    } finally {
      setWorking(false);
    }
  }
  if (loading)
    return (
      <PageContainer>
        <LoadingState label="Loading inquiry…" />
      </PageContainer>
    );
  if (error && !inquiry)
    return (
      <PageContainer>
        <ErrorState title="Unable to load inquiry" detail={error} />
      </PageContainer>
    );
  if (!inquiry) return null;
  return (
    <PageContainer>
      <Link href={base} className="text-sm font-semibold underline">
        ← Back to inquiries
      </Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {inquiry.referenceNumber}
              </p>
              <h1 className="mt-1 text-3xl font-semibold">{inquiry.subject}</h1>
            </div>
            <StatusBadge status={inquiry.status} />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {inquiry.vendor.businessName}
          </p>
          <Card className="mt-6 space-y-4">
            <div className="space-y-4">
              {inquiry.messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-4 ${message.senderType === (mode === "vendor" ? "VENDOR" : "USER") ? "bg-slate-100" : "bg-emerald-50"}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {message.senderType}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">
                    {message.body}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            {inquiry.actions.canMessage ? (
              <form
                className="border-t pt-4"
                onSubmit={(event) => void send(event)}
              >
                <label className="text-sm font-medium" htmlFor="inquiry-reply">
                  Reply
                </label>
                <textarea
                  id="inquiry-reply"
                  required
                  minLength={1}
                  maxLength={4000}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded border p-3 text-sm"
                  placeholder="Write a private reply"
                />
                <Button disabled={sending} type="submit">
                  {sending ? "Sending…" : "Send message"}
                </Button>
              </form>
            ) : (
              <p className="border-t pt-4 text-sm text-slate-500">
                Messaging is unavailable for this inquiry.
              </p>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold">Actions</h2>
            {mode === "user" && inquiry.actions.canWithdraw ? (
              <Button
                className="mt-3 w-full"
                variant="secondary"
                disabled={working}
                onClick={() => void action("withdraw")}
              >
                Withdraw inquiry
              </Button>
            ) : null}
            {mode === "user" && inquiry.actions.canClose ? (
              <Button
                className="mt-3 w-full"
                variant="secondary"
                disabled={working}
                onClick={() => void action("close")}
              >
                Close inquiry
              </Button>
            ) : null}
            {mode === "vendor" ? (
              <div className="mt-3 space-y-2">
                <label className="text-sm font-medium" htmlFor="status">
                  Update status
                </label>
                <select
                  id="status"
                  disabled={working}
                  className="min-h-10 w-full rounded border px-3 text-sm"
                  defaultValue={inquiry.status}
                  onChange={(event) => void updateStatus(event.target.value)}
                >
                  <option value={inquiry.status}>{inquiry.status}</option>
                  <option value="VIEWED">VIEWED</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            ) : null}
          </Card>
          <Card>
            <h2 className="font-semibold">Status history</h2>
            <ol className="mt-3 space-y-3">
              {inquiry.statusHistory.map((item, index) => (
                <li key={`${item.createdAt}-${index}`} className="text-sm">
                  <span className="font-semibold">{item.toStatus}</span>
                  <span className="text-slate-500">
                    {" "}
                    · {new Date(item.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          {error ? <ErrorState title="Action failed" detail={error} /> : null}
        </div>
      </div>
    </PageContainer>
  );
}
