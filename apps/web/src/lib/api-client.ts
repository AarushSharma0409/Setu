import type {
  ApiErrorBody,
  CategorySummary,
  CitySummary,
  StateSummary,
  VendorDocumentSummary,
  VendorDocumentType,
  VendorProfileSummary,
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
};

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
