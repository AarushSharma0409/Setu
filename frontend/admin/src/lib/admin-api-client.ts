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

export interface ManagedAdmin extends AdminIdentity {
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSecuritySummary {
  admin: AdminIdentity & { lastLoginAt: string | null };
  activeSessions: number;
  recoveryCodesRemaining: number;
}

export interface CatalogOverview {
  categories: Array<{ id: string; name: string; slug: string; isActive: boolean; sortOrder: number }>;
  states: Array<{ id: string; name: string; code: string; isActive: boolean }>;
  cities: Array<{ id: string; stateId: string; name: string; slug: string; isActive: boolean; state: { name: string; code: string } }>;
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

export interface InsuranceDashboard {
  activeOperatingModel: number;
  organizationsPendingVerification: number;
  activeInsurers: number;
  activeIntermediaries: number;
  licencesExpiringSoon: number;
  activePolicyTypes: number;
  publishedDisclosures: number;
  publishedConsentTemplates: number;
}

export interface InsuranceOperatingModel {
  id: string;
  legalEntityName: string;
  tradeName: string | null;
  operatingRole: string;
  licenceNumber: string;
  licenceAuthority: string;
  licenceValidFrom: string;
  licenceValidUntil: string | null;
  countryCode: string;
  primaryJurisdiction: string;
  permittedInsuranceLines: string[];
  permittedOrganizationTypes: string[];
  permittedCapabilities: string[];
  restrictedCapabilities: string[];
  configurationVersion: number;
  status: string;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
}

export interface InsuranceOrganization {
  id: string;
  legalName: string;
  tradeName: string | null;
  type: string;
  status: string;
  registrationNumber: string;
  regulatoryAuthority: string;
  registrationValidUntil: string | null;
  updatedAt: string;
  insuranceLines?: Array<{ id: string; code: string; name: string }>;
}

export interface InsurancePolicyType {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  isEnabledForMvp: boolean;
  insuranceLine: { id: string; code: string; name: string };
}

export interface InsuranceTemplate {
  id: string;
  code: string;
  name: string;
  purpose: string;
  status: string;
  version: number;
  content: string;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
}

export interface InsuranceProductListItem {
  id: string;
  code: string;
  slug: string;
  status: string;
  organization: { id: string; legalName: string; slug: string };
  policyType: { id: string; code: string; name: string };
  currentVersion: {
    id: string;
    versionNumber: number;
    status: string;
    name: string;
    effectiveFrom: string | null;
    effectiveUntil: string | null;
  } | null;
  updatedAt: string;
}

export interface InsuranceProductDetail extends InsuranceProductListItem {
  versions: Array<{
    id: string;
    versionNumber: number;
    status: string;
    name: string;
    effectiveFrom: string | null;
    effectiveUntil: string | null;
    rejectionReason: string | null;
  }>;
  currentVersion:
    | (NonNullable<InsuranceProductListItem["currentVersion"]> &
        Record<string, unknown>)
    | null;
  documents: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    originalFileName: string;
  }>;
}

export interface InsuranceIntegrationSummary {
  id: string;
  code: string;
  name: string;
  environment: string;
  status: string;
  authType: string;
  healthStatus: string;
  credentialConfigured: boolean;
  productMappingCount?: number;
  organization?: { legalName: string; tradeName: string | null };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...requestInit } = init;
  const response = await fetch(`${adminEnv.NEXT_PUBLIC_API_URL}${path}`, {
    ...requestInit,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
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
  adminUsers: (accessToken: string) =>
    request<{ items: ManagedAdmin[] }>("/admin/admin-users", { headers: withAuth(accessToken) }),
  createAdminUser: (accessToken: string, input: { email: string; password: string; role: string }) =>
    request<{ admin: AdminIdentity }>("/admin/admin-users", { method: "POST", headers: withAuth(accessToken), body: JSON.stringify(input) }),
  updateAdminUser: (accessToken: string, adminId: string, input: { role?: string; status?: string }) =>
    request<{ admin: AdminIdentity }>(`/admin/admin-users/${adminId}`, { method: "PATCH", headers: withAuth(accessToken), body: JSON.stringify(input) }),
  setAdminPassword: (accessToken: string, adminId: string, password: string) =>
    request<{ ok: boolean }>(`/admin/admin-users/${adminId}/password`, { method: "POST", headers: withAuth(accessToken), body: JSON.stringify({ password }) }),
  security: (accessToken: string) =>
    request<AdminSecuritySummary>("/admin/auth/security", { headers: withAuth(accessToken) }),
  changePassword: (accessToken: string, input: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean }>("/admin/auth/change-password", { method: "POST", headers: withAuth(accessToken), body: JSON.stringify(input) }),
  regenerateRecoveryCodes: (accessToken: string, code: string) =>
    request<{ recoveryCodes: string[] }>("/admin/auth/recovery-codes/regenerate", { method: "POST", headers: withAuth(accessToken), body: JSON.stringify({ code }) }),
  revokeAllSessions: (accessToken: string) =>
    request<{ ok: boolean }>("/admin/auth/sessions/revoke-all", { method: "POST", headers: withAuth(accessToken), body: "{}" }),
  catalog: (accessToken: string) => request<CatalogOverview>("/admin/catalog", { headers: withAuth(accessToken) }),
  createCatalogCategory: (accessToken: string, input: { name: string; description?: string }) => request<unknown>("/admin/catalog/categories", { method: "POST", headers: withAuth(accessToken), body: JSON.stringify(input) }),
  createCatalogState: (accessToken: string, input: { name: string; code: string }) => request<unknown>("/admin/catalog/states", { method: "POST", headers: withAuth(accessToken), body: JSON.stringify(input) }),
  createCatalogCity: (accessToken: string, input: { name: string; stateId: string }) => request<unknown>("/admin/catalog/cities", { method: "POST", headers: withAuth(accessToken), body: JSON.stringify(input) }),
  setCatalogCategoryStatus: (accessToken: string, id: string, isActive: boolean) => request<unknown>(`/admin/catalog/categories/${id}/status`, { method: "PATCH", headers: withAuth(accessToken), body: JSON.stringify({ isActive }) }),
  setCatalogCityStatus: (accessToken: string, id: string, isActive: boolean) => request<unknown>(`/admin/catalog/cities/${id}/status`, { method: "PATCH", headers: withAuth(accessToken), body: JSON.stringify({ isActive }) }),
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
  reactivateVendor: (accessToken: string, vendorId: string, notes?: string) =>
    request<VendorDetail>(`/admin/vendors/${vendorId}/reactivate`, {
      method: "POST", headers: withAuth(accessToken), body: JSON.stringify({ notes }),
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
  insuranceDashboard: (accessToken: string) =>
    request<InsuranceDashboard>("/admin/insurance", {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceOperatingModels: (accessToken: string) =>
    request<{ items: InsuranceOperatingModel[] }>(
      "/admin/insurance/operating-model",
      { cache: "no-store", headers: withAuth(accessToken) },
    ),
  createInsuranceOperatingModel: (
    accessToken: string,
    input: Record<string, unknown>,
  ) =>
    request<InsuranceOperatingModel>("/admin/insurance/operating-model", {
      method: "POST",
      headers: withAuth(accessToken),
      body: JSON.stringify(input),
    }),
  activateInsuranceOperatingModel: (accessToken: string, id: string) =>
    request<InsuranceOperatingModel>(
      `/admin/insurance/operating-model/${id}/activate`,
      { method: "POST", headers: withAuth(accessToken), body: "{}" },
    ),
  insuranceOrganizations: (accessToken: string, query = "") =>
    request<{
      items: InsuranceOrganization[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>(`/admin/insurance/organizations${query ? `?${query}` : ""}`, {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceOrganization: (accessToken: string, id: string) =>
    request<InsuranceOrganization & Record<string, unknown>>(
      `/admin/insurance/organizations/${id}`,
      { cache: "no-store", headers: withAuth(accessToken) },
    ),
  insuranceLines: (accessToken: string) =>
    request<{ items: Array<{ id: string; code: string; name: string }> }>(
      "/admin/insurance/lines",
      { cache: "no-store", headers: withAuth(accessToken) },
    ),
  insurancePolicyTypes: (accessToken: string) =>
    request<{ items: InsurancePolicyType[] }>("/admin/insurance/policy-types", {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceDisclosures: (accessToken: string) =>
    request<{
      items: Array<
        InsuranceTemplate & {
          audience: string;
          requiresAcknowledgement: boolean;
        }
      >;
    }>("/admin/insurance/disclosures", {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceDisclosure: (accessToken: string, id: string) =>
    request<
      InsuranceTemplate & { audience: string; requiresAcknowledgement: boolean }
    >(`/admin/insurance/disclosures/${id}`, {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceConsentTemplates: (accessToken: string) =>
    request<{ items: InsuranceTemplate[] }>(
      "/admin/insurance/consent-templates",
      {
        cache: "no-store",
        headers: withAuth(accessToken),
      },
    ),
  insuranceConsentTemplate: (accessToken: string, id: string) =>
    request<InsuranceTemplate>(`/admin/insurance/consent-templates/${id}`, {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceProducts: (accessToken: string, query = "") =>
    request<{
      items: InsuranceProductListItem[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>(`/admin/insurance/products${query ? `?${query}` : ""}`, {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceProduct: (accessToken: string, id: string) =>
    request<InsuranceProductDetail>(`/admin/insurance/products/${id}`, {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  createInsuranceProduct: (
    accessToken: string,
    input: Record<string, string>,
  ) =>
    request<InsuranceProductDetail>("/admin/insurance/products", {
      method: "POST",
      headers: withAuth(accessToken),
      body: JSON.stringify(input),
    }),
  submitInsuranceProductVersion: (
    accessToken: string,
    productId: string,
    versionId: string,
  ) =>
    request<InsuranceProductDetail>(
      `/admin/insurance/products/${productId}/versions/${versionId}/submit`,
      {
        method: "POST",
        headers: withAuth(accessToken),
        body: "{}",
      },
    ),
  approveInsuranceProductVersion: (
    accessToken: string,
    productId: string,
    versionId: string,
  ) =>
    request<InsuranceProductDetail>(
      `/admin/insurance/products/${productId}/versions/${versionId}/approve`,
      {
        method: "POST",
        headers: withAuth(accessToken),
        body: "{}",
      },
    ),
  insuranceIntegrations: (accessToken: string) =>
    request<{ items: InsuranceIntegrationSummary[] }>(
      "/admin/insurance/integrations",
      { cache: "no-store", headers: withAuth(accessToken) },
    ),
  insuranceIntegrationDashboard: (accessToken: string) =>
    request<{
      active: number;
      sandbox: number;
      production: number;
      healthy: number;
      degraded: number;
      unavailable: number;
      requestsLast24Hours: number;
      failuresLast24Hours: number;
      handoffsCreatedLast24Hours: number;
      callbacksAwaitingProcessing: number;
    }>("/admin/insurance/integrations/dashboard", {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  testInsuranceIntegration: (accessToken: string, id: string) =>
    request<{ status: string; checkedAt: string; summary: string }>(
      `/admin/insurance/integrations/${id}/health`,
      { headers: withAuth(accessToken) },
    ),
  insuranceOperationsSummary: (accessToken: string, query = "") =>
    request<{
      quoteRequests: number;
      completedQuotes: number;
      partialQuotes: number;
      failedQuotes: number;
      activeProviders: number;
      degradedProviders: number;
      unavailableProviders: number;
      handoffsCreated: number;
      handoffFailures: number;
      callbacksPending: number;
      callbacksFailed: number;
      warnings: Array<{ code: string; severity: string; count: number }>;
    }>(`/admin/insurance/operations/summary${query ? `?${query}` : ""}`, {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceOperationsList: (
    accessToken: string,
    resource: "quotes" | "providers" | "callbacks" | "handoffs",
    query = "",
  ) =>
    request<{
      items: Array<Record<string, unknown>>;
      meta: Record<string, number>;
    }>(`/admin/insurance/operations/${resource}${query ? `?${query}` : ""}`, {
      cache: "no-store",
      headers: withAuth(accessToken),
    }),
  insuranceOperationsDetail: (
    accessToken: string,
    resource: "quotes" | "providers" | "callbacks" | "handoffs",
    id: string,
  ) =>
    request<Record<string, unknown>>(
      `/admin/insurance/operations/${resource}/${id}`,
      { cache: "no-store", headers: withAuth(accessToken) },
    ),
  insuranceSupportSearch: (accessToken: string, query: string) =>
    request<Record<string, unknown>>(
      `/admin/insurance/operations/support/search?${query}`,
      { cache: "no-store", headers: withAuth(accessToken) },
    ),
};
