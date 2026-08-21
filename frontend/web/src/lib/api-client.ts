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

export interface InsuranceQuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface InsuranceQuestion {
  id: string;
  key: string;
  label: string;
  description: string | null;
  fieldType: string;
  isRequired: boolean;
  dataClassification: string;
  validationConfig: unknown;
  visibilityConfig: unknown;
  options: InsuranceQuestionOption[];
}

export interface InsuranceAssessmentSection {
  id: string;
  key: string;
  title: string;
  description: string | null;
  questions: InsuranceQuestion[];
}

export interface InsuranceAssessmentSummary {
  id: string;
  referenceNumber: string;
  status: string;
  completionPercentage: number;
  currentSectionKey: string | null;
  lastSavedAt: string;
  submittedAt: string | null;
  version: number;
  policyType?: { id: string; name: string; slug: string };
}

interface RegisterInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

interface LoginInput {
  identifier: string;
  password: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  const { headers, ...requestInit } = init;
  const response = await fetch(`${webEnv.NEXT_PUBLIC_API_URL}${path}`, {
    ...requestInit,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    cache: path.startsWith("/insurance/") ? "no-store" : init.cache,
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
  createQuoteInterest: (service: string) =>
    request<{
      id: string;
      status: "RECEIVED";
      emailNotification: "SENT" | "FAILED" | "NOT_CONFIGURED";
    }>("/quote-interests", {
      method: "POST",
      body: JSON.stringify({ service }),
    }),
  insurancePolicyTypes: () =>
    request<{
      items: Array<{
        id: string;
        code: string;
        name: string;
        slug: string;
        description: string | null;
      }>;
    }>("/insurance/policy-types"),
  insuranceAssessments: (accessToken: string) =>
    request<{
      items: Array<{
        id: string;
        referenceNumber: string;
        status: string;
        completionPercentage: number;
        policyType: { name: string; slug: string };
      }>;
    }>("/insurance/needs/assessments", { headers: authHeaders(accessToken) }),
  createInsuranceAssessment: (
    accessToken: string,
    policyTypeId: string,
    abandonExisting = false,
  ) =>
    request<{ id: string; referenceNumber: string }>(
      "/insurance/needs/assessments",
      {
        method: "POST",
        body: JSON.stringify({ policyTypeId, abandonExisting }),
        headers: authHeaders(accessToken),
      },
    ),
  insuranceAssessment: (accessToken: string, assessmentId: string) =>
    request<
      InsuranceAssessmentSummary & {
        answers: Array<{
          questionId: string;
          questionKey: string;
          dataClassification: string;
          value: unknown;
        }>;
      }
    >(`/insurance/needs/assessments/${encodeURIComponent(assessmentId)}`, {
      headers: authHeaders(accessToken),
    }),
  insuranceAssessmentSchema: (accessToken: string, assessmentId: string) =>
    request<{
      assessment: InsuranceAssessmentSummary;
      schema: { sections: InsuranceAssessmentSection[] };
    }>(
      `/insurance/needs/assessments/${encodeURIComponent(assessmentId)}/schema`,
      {
        headers: authHeaders(accessToken),
      },
    ),
  saveInsuranceAssessmentAnswers: (
    accessToken: string,
    assessmentId: string,
    input: {
      sectionKey: string;
      version: number;
      answers: Array<{ questionId: string; value: unknown }>;
    },
  ) =>
    request<{
      assessment: InsuranceAssessmentSummary;
      completionPercentage: number;
      missingRequiredQuestions: string[];
    }>(
      `/insurance/needs/assessments/${encodeURIComponent(assessmentId)}/answers`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
        headers: authHeaders(accessToken),
      },
    ),
  insuranceAssessmentReview: (accessToken: string, assessmentId: string) =>
    request<{
      assessment: InsuranceAssessmentSummary & {
        answers: Array<{ questionKey: string; value: unknown }>;
      };
      completion: {
        completionPercentage: number;
        missingRequiredQuestions: string[];
      };
      disclosures: {
        items: Array<{
          id: string;
          name: string;
          content: string;
          version: number;
          requiresAcknowledgement: boolean;
          acknowledgedAt: string | null;
        }>;
      };
      consents: {
        items: Array<{
          id: string;
          name: string;
          content: string;
          description: string | null;
          version: number;
          purpose: string;
          required: boolean;
          record: { status: string } | null;
        }>;
      };
    }>(
      `/insurance/needs/assessments/${encodeURIComponent(assessmentId)}/review`,
      {
        headers: authHeaders(accessToken),
      },
    ),
  acknowledgeInsuranceDisclosure: (
    accessToken: string,
    assessmentId: string,
    templateId: string,
  ) =>
    request<Record<string, unknown>>(
      `/insurance/needs/assessments/${encodeURIComponent(assessmentId)}/disclosures/${encodeURIComponent(templateId)}/acknowledge`,
      { method: "POST", body: "{}", headers: authHeaders(accessToken) },
    ),
  grantInsuranceConsent: (
    accessToken: string,
    assessmentId: string,
    templateId: string,
  ) =>
    request<Record<string, unknown>>(
      `/insurance/needs/assessments/${encodeURIComponent(assessmentId)}/consents/${encodeURIComponent(templateId)}/grant`,
      { method: "POST", body: "{}", headers: authHeaders(accessToken) },
    ),
  submitInsuranceAssessment: (accessToken: string, assessmentId: string) =>
    request<{
      assessment: InsuranceAssessmentSummary;
      alreadySubmitted: boolean;
    }>(
      `/insurance/needs/assessments/${encodeURIComponent(assessmentId)}/submit`,
      { method: "POST", body: "{}", headers: authHeaders(accessToken) },
    ),
  insuranceQuoteRequests: (accessToken: string) =>
    request<{
      items: Array<{
        id: string;
        referenceNumber: string;
        status: string;
        requestedAt: string;
        expiresAt: string | null;
        generatedQuoteCount: number;
        policyType: { name: string; slug: string };
      }>;
    }>("/insurance/quotes", { headers: authHeaders(accessToken) }),
  createInsuranceQuoteRequest: (
    accessToken: string,
    assessmentId: string,
    idempotencyKey: string,
  ) =>
    request<{ referenceNumber: string; status: string }>("/insurance/quotes", {
      method: "POST",
      body: JSON.stringify({ assessmentId }),
      headers: {
        ...authHeaders(accessToken),
        "Idempotency-Key": idempotencyKey,
      },
    }),
  insuranceComparison: (
    accessToken: string,
    quoteRequestId: string,
    query = "",
  ) =>
    request<{
      items: Array<{
        quoteId: string;
        insurer: { name: string };
        product: { name: string };
        premium: { currency: string; total: string } | null;
        sumInsured: string | null;
        deductible: string | null;
        waitingPeriods: string | null;
        coreCoverage: string | null;
        exclusions: string | null;
        addons: string | null;
        validUntil: string | null;
        saved: boolean;
      }>;
    }>(
      `/insurance/quote-requests/${encodeURIComponent(quoteRequestId)}/comparison${query ? `?${query}` : ""}`,
      { headers: authHeaders(accessToken) },
    ),
  saveInsuranceQuote: (accessToken: string, quoteId: string) =>
    request<{ id: string }>(
      `/insurance/quotes/${encodeURIComponent(quoteId)}/save`,
      { method: "POST", body: "{}", headers: authHeaders(accessToken) },
    ),
  unsaveInsuranceQuote: (accessToken: string, quoteId: string) =>
    request<{ ok: boolean }>(
      `/insurance/quotes/${encodeURIComponent(quoteId)}/save`,
      { method: "DELETE", headers: authHeaders(accessToken) },
    ),
  savedInsuranceQuotes: (accessToken: string) =>
    request<{
      items: Array<{
        id: string;
        savedAt: string;
        quote: {
          id: string;
          status: string;
          totalPremium: string | null;
          currency: string | null;
          validUntil: string | null;
          organization: { legalName: string; tradeName: string | null };
          productVersion: { name: string };
        };
      }>;
    }>("/insurance/saved-quotes", { headers: authHeaders(accessToken) }),
  createInsuranceHandoff: (accessToken: string, quoteId: string) =>
    request<{
      handoffId: string;
      referenceNumber: string;
      redirectUrl: string;
      expiresAt: string;
      providerName: string;
    }>(`/insurance/quotes/${encodeURIComponent(quoteId)}/handoff`, {
      method: "POST",
      body: "{}",
      headers: authHeaders(accessToken),
    }),
  recordInsuranceHandoffRedirect: (accessToken: string, handoffId: string) =>
    request<{ ok: boolean }>(
      `/insurance/handoffs/${encodeURIComponent(handoffId)}/redirect`,
      { method: "POST", body: "{}", headers: authHeaders(accessToken) },
    ),
  insuranceHandoffReturn: (state: string) =>
    request<{
      referenceNumber: string;
      providerName: string;
      status: string;
      expiresAt: string;
    }>(`/insurance/handoff/return?state=${encodeURIComponent(state)}`),
  insuranceQuoteRequest: (accessToken: string, quoteRequestId: string) =>
    request<{
      referenceNumber: string;
      status: string;
      requestedAt: string;
      completedAt: string | null;
      expiresAt: string | null;
      policyType: { name: string; slug: string };
      quotes: Array<{
        id: string;
        status: string;
        currency: string | null;
        totalPremium: string | null;
        sumInsured: string | null;
        validUntil: string | null;
        organizationName: string;
        productName: string;
        productDescription: string;
        coverageSummary: string | null;
        waitingPeriodSummary: string | null;
        exclusionSummary: string | null;
      }>;
    }>(`/insurance/quotes/${encodeURIComponent(quoteRequestId)}`, {
      headers: authHeaders(accessToken),
    }),
  health: () =>
    request<{ status: string; dependencies: Record<string, string> }>(
      "/health",
    ),
  register: (input: RegisterInput) =>
    request<{
      accessToken: string;
      refreshToken: string;
      user: PublicUser;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  login: (input: LoginInput) =>
    request<{
      accessToken: string;
      refreshToken: string;
      user: PublicUser;
    }>("/auth/login", {
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
  requestPasswordReset: (email: string) =>
    request<{ ok: boolean; message: string }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: boolean }>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  googleIdToken: (credential: string) =>
    request<{
      accessToken: string;
      refreshToken: string;
      user: PublicUser;
    }>("/auth/google/token", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
  requestPhoneOtp: (phone: string) =>
    request<{ ok: boolean }>("/auth/phone-otp/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  verifyPhoneOtp: (input: {
    createAccount: boolean;
    name?: string;
    otp: string;
    phone: string;
  }) =>
    request<{
      accessToken: string;
      refreshToken: string;
      user: PublicUser;
    }>("/auth/phone-otp/verify", {
      method: "POST",
      body: JSON.stringify(input),
    }),
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
