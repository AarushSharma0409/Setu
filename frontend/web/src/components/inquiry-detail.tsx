"use client";

import type { InquiryDetailContract, InquiryMessageContract } from "@setu/types";
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
  const counterpartLabel = mode === "vendor" ? "Customer" : "Provider";

  const load = useCallback(() => {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) {
      window.location.href = `/auth?returnTo=${encodeURIComponent(`${base}/${id}`)}`;
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
    if (!token || !body.trim()) return;

    setSending(true);
    setError(null);
    try {
      if (mode === "vendor") {
        await publicApi.sendVendorInquiryMessage(token, id, body.trim());
      } else {
        await publicApi.sendInquiryMessage(token, id, body.trim());
      }
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
      if (kind === "withdraw") {
        await publicApi.withdrawInquiry(token, id, "Withdrawn by user");
      } else {
        await publicApi.closeInquiry(token, id, "Closed by user");
      }
      load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Action could not be completed",
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

  if (loading) {
    return (
      <PageContainer>
        <LoadingState label="Loading conversation..." />
      </PageContainer>
    );
  }

  if (error && !inquiry) {
    return (
      <PageContainer>
        <ErrorState title="Unable to load conversation" detail={error} />
      </PageContainer>
    );
  }

  if (!inquiry) return null;

  return (
    <PageContainer className="setu-chat-page">
      <Link href={base} className="setu-chat-back">
        Back to {mode === "vendor" ? "lead inbox" : "inquiries"}
      </Link>

      <div className="setu-chat-layout">
        <main>
          <header className="setu-chat-hero">
            <div className="setu-chat-avatar" aria-hidden="true">
              {inquiry.vendor.businessName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="setu-eyebrow">Private conversation</p>
                <StatusBadge status={inquiry.status} />
              </div>
              <h1>{inquiry.subject}</h1>
              <p>
                {mode === "vendor"
                  ? "A customer is waiting to hear from you."
                  : `Chatting with ${inquiry.vendor.businessName}.`}
              </p>
            </div>
            <span className="setu-chat-spark" aria-hidden="true">
              Live
            </span>
          </header>

          <Card className="setu-chat-thread">
            <div className="setu-chat-thread-head">
              <div>
                <p className="setu-eyebrow">Messages</p>
                <h2>Keep the details in one place</h2>
              </div>
              <span>{inquiry.messages.length} total</span>
            </div>

            <div className="setu-chat-messages" aria-live="polite">
              {inquiry.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMine={message.senderType === (mode === "vendor" ? "VENDOR" : "USER")}
                  counterpartLabel={counterpartLabel}
                />
              ))}
            </div>

            {inquiry.actions.canMessage ? (
              <form className="setu-chat-composer" onSubmit={(event) => void send(event)}>
                <label className="sr-only" htmlFor="inquiry-reply">
                  Write a reply
                </label>
                <textarea
                  id="inquiry-reply"
                  required
                  minLength={1}
                  maxLength={4000}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={`Write a helpful reply to the ${counterpartLabel.toLowerCase()}...`}
                />
                <div className="setu-chat-composer-actions">
                  <small>Private and visible only to this conversation</small>
                  <Button disabled={sending} type="submit">
                    {sending ? "Sending..." : "Send reply"}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="setu-chat-closed-note">
                This conversation is no longer accepting new messages.
              </p>
            )}
          </Card>
        </main>

        <aside className="setu-chat-aside">
          <Card className="setu-chat-context-card">
            <p className="setu-eyebrow">Conversation with</p>
            <h2>{mode === "vendor" ? "A Setu customer" : inquiry.vendor.businessName}</h2>
            <p>
              {mode === "vendor"
                ? "Reply promptly to help turn this inquiry into a lasting customer relationship."
                : "Ask questions, share the details you need, and decide when you are ready."}
            </p>
            {inquiry.category ? (
              <span className="setu-chat-topic">{inquiry.category.name}</span>
            ) : null}
            {inquiry.serviceCity ? (
              <span className="setu-chat-city">
                Serving {inquiry.serviceCity.name}, {inquiry.serviceCity.stateName}
              </span>
            ) : null}
          </Card>

          <Card className="setu-chat-actions-card">
            <p className="setu-eyebrow">Conversation actions</p>
            <h2>Manage this inquiry</h2>
            {mode === "user" && inquiry.actions.canWithdraw ? (
              <Button
                className="mt-4 w-full"
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
                Close conversation
              </Button>
            ) : null}
            {mode === "vendor" ? (
              <div className="mt-4">
                <label htmlFor="status">Update progress</label>
                <select
                  id="status"
                  disabled={working}
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

          <Card className="setu-chat-history-card">
            <p className="setu-eyebrow">Timeline</p>
            <h2>What has happened</h2>
            <ol>
              {inquiry.statusHistory.map((item, index) => (
                <li key={`${item.createdAt}-${index}`}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{formatStatus(item.toStatus)}</strong>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {error ? <ErrorState title="Action failed" detail={error} /> : null}
        </aside>
      </div>
    </PageContainer>
  );
}

function MessageBubble({
  message,
  isMine,
  counterpartLabel,
}: {
  message: InquiryMessageContract;
  isMine: boolean;
  counterpartLabel: string;
}) {
  const sender = isMine ? "You" : counterpartLabel;

  return (
    <article className={`setu-chat-message ${isMine ? "setu-chat-message-mine" : ""}`}>
      <div className="setu-chat-message-avatar" aria-hidden="true">
        {isMine ? "You" : counterpartLabel.slice(0, 1)}
      </div>
      <div className="setu-chat-message-content">
        <div className="setu-chat-message-meta">
          <strong>{sender}</strong>
          <time dateTime={message.createdAt}>
            {new Date(message.createdAt).toLocaleString()}
          </time>
        </div>
        <p>{message.body}</p>
      </div>
    </article>
  );
}

function formatStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}
