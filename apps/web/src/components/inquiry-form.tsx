"use client";

import { Button, Card, ErrorState, Input } from "@setu/ui";
import React, { useState, type FormEvent } from "react";

import { publicApi } from "../lib/api-client";

const tokenKey = "setu_public_access_token";

export function InquiryForm({
  vendorId,
  vendorName,
  returnPath,
}: {
  vendorId: string;
  vendorName: string;
  returnPath: string;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    referenceNumber: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem(tokenKey);
    if (!token) {
      window.location.href = `/dev-auth?returnTo=${encodeURIComponent(returnPath)}`;
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await publicApi.createInquiry(
        token,
        { vendorId, subject, message },
        `web-${crypto.randomUUID()}`,
      );
      setResult({ id: created.id, referenceNumber: created.referenceNumber });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Inquiry could not be submitted",
      );
    } finally {
      setLoading(false);
    }
  }

  if (result)
    return (
      <Card>
        <h2 className="text-lg font-semibold">Inquiry submitted</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your message was sent to {vendorName}.
        </p>
        <p className="mt-2 text-sm font-semibold">
          Reference: {result.referenceNumber}
        </p>
        <a
          className="mt-4 inline-block text-sm font-semibold underline"
          href={`/account/inquiries/${result.id}`}
        >
          View inquiry
        </a>
      </Card>
    );

  return (
    <Card>
      <h2 className="text-lg font-semibold">Contact {vendorName}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Send a private inquiry to this approved provider.
      </p>
      <form className="mt-4 space-y-3" onSubmit={(event) => void submit(event)}>
        <label className="block text-sm font-medium" htmlFor="inquiry-subject">
          Subject
        </label>
        <Input
          id="inquiry-subject"
          minLength={5}
          maxLength={160}
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="What do you need help with?"
        />
        <label className="block text-sm font-medium" htmlFor="inquiry-message">
          Message
        </label>
        <textarea
          id="inquiry-message"
          required
          minLength={20}
          maxLength={4000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-32 w-full rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Share useful details about your request."
        />
        <Button disabled={loading} type="submit">
          {loading ? "Sending…" : "Send inquiry"}
        </Button>
      </form>
      {error ? (
        <div className="mt-4">
          <ErrorState title="Inquiry failed" detail={error} />
        </div>
      ) : null}
    </Card>
  );
}
