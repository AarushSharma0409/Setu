import type {
  ApiErrorBody,
  CategorySummary,
  CitySummary,
  StateSummary,
  VendorDocumentSummary,
  VendorDocumentType,
  VendorProfileSummary,
  PublicCategory,
  PublicCity,
  PublicVendorDetail,
  PublicVendorListResponse,
  InquiryDetailContract,
  InquiryListItem,
  NotificationContract,
} from "@setu/types";

import { webEnv } from "./env";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
  }
}

export interface PublicUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role: string;
  status: string;
}

interface DevLoginInput {
  email?: string;
  phone?: string;
  name?: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${webEnv.NEXT_PUBLIC_API_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = await readJson<ApiErrorBody>(response);
    throw new ApiClientError(
      body?.message ?? "API request failed",
      response.status,
      body ?? undefined,
    );
  }

  return (await readJson<T>(response)) ?? ({} as T);
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

export const publicApi = {
  health: () =>
    request<{ status: string; dependencies: Record<string, string> }>(
      "/health",
    ),
  devLogin: (input: DevLoginInput) =>
    request<{
      accessToken: string;
      refreshToken: string;
      user: PublicUser;
      warning: string;
    }>("/auth/dev-login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  me: (accessToken: string) =>
    request<{ user: PublicUser }>("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  refresh: () =>
    request<{ accessToken: string; user: PublicUser }>("/auth/refresh", {
      method: "POST",
      body: "{}",
    }),
  logout: () =>
    request<{ ok: boolean }>("/auth/logout", { method: "POST", body: "{}" }),
  categories: () => request<{ categories: CategorySummary[] }>("/categories"),
  publicCategories: () =>
    request<{ categories: PublicCategory[] }>("/public/categories"),
  publicCities: () => request<{ cities: PublicCity[] }>("/public/cities"),
  publicVendors: (query: Record<string, string | number> = {}) => {
    const search = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) =>
      search.set(key, String(value)),
    );
    return request<PublicVendorListResponse>(
      `/public/vendors?${search.toString()}`,
    );
  },
  publicVendor: (slug: string) =>
    request<{ vendor: PublicVendorDetail }>(
      `/public/vendors/${encodeURIComponent(slug)}`,
    ),
  states: () => request<{ states: StateSummary[] }>("/locations/states"),
  cities: (stateId?: string) =>
    request<{ cities: CitySummary[] }>(
      `/locations/cities${stateId ? `?stateId=${stateId}` : ""}`,
    ),
  startVendorOnboarding: (accessToken: string) =>
    request<{ vendor: VendorProfileSummary }>("/vendors/onboarding/start", {
      method: "POST",
      body: "{}",
      headers: authHeaders(accessToken),
    }),
  vendorMe: (accessToken: string) =>
    request<{ vendor: VendorProfileSummary }>("/vendors/me", {
      headers: authHeaders(accessToken),
    }),
  updateVendorProfile: (
    accessToken: string,
    input: Partial<VendorProfileSummary>,
  ) =>
    request<{ vendor: VendorProfileSummary }>("/vendors/me/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: authHeaders(accessToken),
    }),
  replaceVendorCategories: (accessToken: string, categoryIds: string[]) =>
    request<{ vendor: VendorProfileSummary }>("/vendors/me/categories", {
      method: "PUT",
      body: JSON.stringify({ categoryIds }),
      headers: authHeaders(accessToken),
    }),
  replaceVendorServiceAreas: (
    accessToken: string,
    cityIds: string[],
    primaryCityId?: string,
  ) =>
    request<{ vendor: VendorProfileSummary }>("/vendors/me/service-areas", {
      method: "PUT",
      body: JSON.stringify({ cityIds, primaryCityId }),
      headers: authHeaders(accessToken),
    }),
  vendorDocuments: (accessToken: string) =>
    request<{ documents: VendorDocumentSummary[] }>("/vendors/me/documents", {
      headers: authHeaders(accessToken),
    }),
  uploadVendorDocument: (
    accessToken: string,
    type: VendorDocumentType,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);

    return request<{ vendor: VendorProfileSummary }>("/vendors/me/documents", {
      method: "POST",
      body: formData,
      headers: authHeaders(accessToken),
    });
  },
  deleteVendorDocument: (accessToken: string, documentId: string) =>
    request<{ ok: boolean }>(`/vendors/me/documents/${documentId}`, {
      method: "DELETE",
      headers: authHeaders(accessToken),
    }),
  submitVendor: (accessToken: string) =>
    request<{ vendor: VendorProfileSummary }>("/vendors/me/submit", {
      method: "POST",
      body: "{}",
      headers: authHeaders(accessToken),
    }),
  createInquiry: (
    accessToken: string,
    input: {
      vendorId: string;
      subject: string;
      message: string;
      categoryId?: string;
      serviceCityId?: string;
      preferredContactMethod?: string;
    },
    idempotencyKey: string,
  ) =>
    request<{
      id: string;
      referenceNumber: string;
      status: string;
      vendor: { id: string; slug: string; businessName: string };
      createdAt: string;
    }>("/inquiries", {
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        ...authHeaders(accessToken),
        "Idempotency-Key": idempotencyKey,
      },
    }),
  inquiries: (
    accessToken: string,
    query: Record<string, string | number> = {},
  ) =>
    request<{
      items: InquiryListItem[];
      pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }>(`/inquiries?${queryString(query)}`, {
      headers: authHeaders(accessToken),
    }),
  inquiry: (accessToken: string, id: string) =>
    request<{ inquiry: InquiryDetailContract }>(
      `/inquiries/${encodeURIComponent(id)}`,
      { headers: authHeaders(accessToken) },
    ),
  sendInquiryMessage: (accessToken: string, id: string, body: string) =>
    request<{
      message: {
        id: string;
        senderType: string;
        body: string;
        createdAt: string;
      };
    }>(`/inquiries/${encodeURIComponent(id)}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
      headers: authHeaders(accessToken),
    }),
  withdrawInquiry: (accessToken: string, id: string, reason?: string) =>
    request<{ ok: boolean; status: string }>(
      `/inquiries/${encodeURIComponent(id)}/withdraw`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
        headers: authHeaders(accessToken),
      },
    ),
  closeInquiry: (accessToken: string, id: string, reason?: string) =>
    request<{ ok: boolean; status: string }>(
      `/inquiries/${encodeURIComponent(id)}/close`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
        headers: authHeaders(accessToken),
      },
    ),
  vendorInquiries: (
    accessToken: string,
    query: Record<string, string | number> = {},
  ) =>
    request<{
      items: InquiryListItem[];
      pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }>(`/vendors/me/inquiries?${queryString(query)}`, {
      headers: authHeaders(accessToken),
    }),
  vendorInquiry: (accessToken: string, id: string) =>
    request<{ inquiry: InquiryDetailContract }>(
      `/vendors/me/inquiries/${encodeURIComponent(id)}`,
      { headers: authHeaders(accessToken) },
    ),
  sendVendorInquiryMessage: (accessToken: string, id: string, body: string) =>
    request<{
      message: {
        id: string;
        senderType: string;
        body: string;
        createdAt: string;
      };
    }>(`/vendors/me/inquiries/${encodeURIComponent(id)}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
      headers: authHeaders(accessToken),
    }),
  updateInquiryStatus: (
    accessToken: string,
    id: string,
    status: string,
    reason?: string,
  ) =>
    request<{ ok: boolean; status: string }>(
      `/vendors/me/inquiries/${encodeURIComponent(id)}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status, reason }),
        headers: authHeaders(accessToken),
      },
    ),
  notifications: (accessToken: string, page = 1) =>
    request<{
      items: NotificationContract[];
      unreadCount: number;
      pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }>(`/notifications?page=${page}`, { headers: authHeaders(accessToken) }),
  notificationUnreadCount: (accessToken: string) =>
    request<{ unreadCount: number }>("/notifications/unread-count", {
      headers: authHeaders(accessToken),
    }),
  markNotificationRead: (accessToken: string, id: string) =>
    request<{ ok: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: "POST",
      body: "{}",
      headers: authHeaders(accessToken),
    }),
  markAllNotificationsRead: (accessToken: string) =>
    request<{ ok: boolean }>("/notifications/read-all", {
      method: "POST",
      body: "{}",
      headers: authHeaders(accessToken),
    }),
};

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function queryString(query: Record<string, string | number>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) =>
    params.set(key, String(value)),
  );
  return params.toString();
}
