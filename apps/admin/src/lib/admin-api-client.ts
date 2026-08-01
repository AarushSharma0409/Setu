import type { ApiErrorBody } from "@setu/types";

import { adminEnv } from "./env";

export class AdminApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
  }
}

export interface AdminIdentity {
  id: string;
  email: string;
  role: string;
  status: string;
  twoFactorEnabled?: boolean;
}

export interface AdminCredentials {
  accessToken: string;
  refreshToken: string;
  admin: AdminIdentity;
}

export interface VendorQueueItem {
  vendorId: string;
  businessName: string | null;
  owner: {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
  };
  primaryCity: { id: string; name: string; state: { name: string } } | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  submittedAt: string | null;
  documentCount: number;
  status: string;
}

export interface VendorDetail {
  id: string;
  owner: AdminIdentity & { phone?: string | null; name?: string | null };
  businessName: string | null;
  legalName: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  yearEstablished: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  primaryCity: unknown;
  serviceAreas: unknown[];
  categories: Array<{ id: string; name: string; slug: string }>;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
  documents: Array<{
    id: string;
    type: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    status: string;
    uploadedAt: string;
  }>;
  verificationDecisions: Array<{
    id: string;
    decision: string;
    reason: string | null;
    notes: string | null;
    createdAt: string;
    adminUser: { id: string; email: string; role: string };
  }>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${adminEnv.NEXT_PUBLIC_API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = await readJson<ApiErrorBody>(response);
    throw new AdminApiClientError(
      body?.message ?? "Admin API request failed",
      response.status,
      body ?? undefined,
    );
  }

  return (await readJson<T>(response)) ?? ({} as T);
}

function withAuth(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

export const adminApi = {
  login: (input: { email: string; password: string }) =>
    request<
      | {
          challengeToken: string;
          nextStep: "TOTP_REQUIRED" | "TOTP_ENROLLMENT_REQUIRED";
        }
      | AdminCredentials
    >("/admin/auth/login", { method: "POST", body: JSON.stringify(input) }),
  startEnrollment: (challengeToken: string) =>
    request<{ challengeToken: string; secret: string; otpauthUri: string }>(
      "/admin/auth/2fa/enrollment/start",
      { method: "POST", body: JSON.stringify({ challengeToken }) },
    ),
  confirmEnrollment: (challengeToken: string, code: string) =>
    request<AdminCredentials & { recoveryCodes: string[] }>(
      "/admin/auth/2fa/enrollment/confirm",
      { method: "POST", body: JSON.stringify({ challengeToken, code }) },
    ),
  verifyTwoFactor: (challengeToken: string, code: string) =>
    request<AdminCredentials>("/admin/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ challengeToken, code }),
    }),
  verifyRecovery: (challengeToken: string, code: string) =>
    request<AdminCredentials>("/admin/auth/2fa/recovery", {
      method: "POST",
      body: JSON.stringify({ challengeToken, code }),
    }),
  me: (accessToken: string) =>
    request<{ admin: AdminIdentity }>("/admin/auth/me", {
      headers: withAuth(accessToken),
    }),
  systemStatus: (accessToken: string) =>
    request<{
      application: string;
      checkedAt: string;
      health: { status: string; dependencies: Record<string, string> };
    }>("/admin/system-status", { headers: withAuth(accessToken) }),
  refresh: () =>
    request<AdminCredentials>("/admin/auth/refresh", {
      method: "POST",
      body: "{}",
    }),
  logout: () =>
    request<{ ok: boolean }>("/admin/auth/logout", {
      method: "POST",
      body: "{}",
    }),
  verificationQueue: (accessToken: string, query = "") =>
    request<{
      items: VendorQueueItem[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>(`/admin/vendors/verification-queue${query ? `?${query}` : ""}`, {
      headers: withAuth(accessToken),
    }),
  vendors: (accessToken: string, query = "") =>
    request<{
      items: VendorQueueItem[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>(`/admin/vendors${query ? `?${query}` : ""}`, {
      headers: withAuth(accessToken),
    }),
  vendorDetail: (accessToken: string, vendorId: string) =>
    request<VendorDetail>(`/admin/vendors/${vendorId}`, {
      headers: withAuth(accessToken),
    }),
  documentAccess: (accessToken: string, vendorId: string, documentId: string) =>
    request<{
      url: string;
      expiresInSeconds: number;
      fileName: string;
      mimeType: string;
    }>(`/admin/vendors/${vendorId}/documents/${documentId}/access`, {
      method: "POST",
      headers: withAuth(accessToken),
      body: "{}",
    }),
  approveVendor: (accessToken: string, vendorId: string, notes?: string) =>
    request<VendorDetail>(`/admin/vendors/${vendorId}/approve`, {
      method: "POST",
      headers: withAuth(accessToken),
      body: JSON.stringify({ notes }),
    }),
  rejectVendor: (
    accessToken: string,
    vendorId: string,
    reason: string,
    notes?: string,
  ) =>
    request<VendorDetail>(`/admin/vendors/${vendorId}/reject`, {
      method: "POST",
      headers: withAuth(accessToken),
      body: JSON.stringify({ reason, notes }),
    }),
  suspendVendor: (
    accessToken: string,
    vendorId: string,
    reason: string,
    notes?: string,
  ) =>
    request<VendorDetail>(`/admin/vendors/${vendorId}/suspend`, {
      method: "POST",
      headers: withAuth(accessToken),
      body: JSON.stringify({ reason, notes }),
    }),
  auditLogs: (accessToken: string, query = "") =>
    request<{
      items: Array<Record<string, unknown>>;
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>(`/admin/audit-logs${query ? `?${query}` : ""}`, {
      headers: withAuth(accessToken),
    }),
};
