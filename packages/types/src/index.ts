export enum UserRole {
  USER = "USER",
  VENDOR = "VENDOR",
}

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  OPERATIONS = "OPERATIONS",
  REVIEWER = "REVIEWER",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DISABLED = "DISABLED",
}

export enum VendorStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export enum VendorDocumentType {
  GST_CERTIFICATE = "GST_CERTIFICATE",
  PAN_CARD = "PAN_CARD",
  BUSINESS_REGISTRATION = "BUSINESS_REGISTRATION",
  ADDRESS_PROOF = "ADDRESS_PROOF",
  OTHER = "OTHER",
}

export enum VendorDocumentStatus {
  UPLOADED = "UPLOADED",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface ApiErrorBody {
  error: string;
  message: string;
  statusCode: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface StateSummary {
  id: string;
  name: string;
  code: string;
}

export interface CitySummary {
  id: string;
  stateId: string;
  stateName?: string;
  name: string;
  slug: string;
}

export interface VendorDocumentSummary {
  id: string;
  type: VendorDocumentType;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  status: VendorDocumentStatus;
  uploadedAt: string;
}

export interface VendorProfileSummary {
  id: string;
  status: VendorStatus;
  businessName?: string | null;
  legalName?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  yearEstablished?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  primaryCityId?: string | null;
  submittedAt?: string | null;
  categories: CategorySummary[];
  serviceAreas: CitySummary[];
  documents: VendorDocumentSummary[];
  missingRequirements: string[];
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface PublicCity {
  id: string;
  name: string;
  slug: string;
  stateName: string;
  stateCode: string;
  stateSlug: string;
}

export interface PublicVendorSummary {
  id: string;
  slug: string;
  businessName: string;
  descriptionExcerpt: string;
  primaryCity: PublicCity;
  categories: Array<Pick<PublicCategory, "name" | "slug">>;
  serviceAreas: PublicCity[];
  yearEstablished?: number | null;
  websiteUrl?: string | null;
  verificationStatusLabel: "Verified";
}

export interface PublicVendorDetail extends PublicVendorSummary {
  legalName?: string | null;
  description: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: { city: string; state: string; postalCode?: string | null };
  approvedAt?: string | null;
  verificationBadge: { label: "Verified" };
}

export interface PublicPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PublicVendorListResponse {
  items: PublicVendorSummary[];
  pagination: PublicPagination;
}

export enum InquiryStatus {
  NEW = "NEW",
  VIEWED = "VIEWED",
  CONTACTED = "CONTACTED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  WITHDRAWN = "WITHDRAWN",
}

export interface InquiryVendorSummary {
  id: string;
  slug: string;
  businessName: string;
}

export interface InquiryListItem {
  id: string;
  referenceNumber: string;
  subject: string;
  status: InquiryStatus;
  vendor: InquiryVendorSummary;
  lastMessagePreview?: string;
  lastMessageAt: string;
  createdAt: string;
  unreadMessageCount: number;
}

export interface InquiryMessageContract {
  id: string;
  senderType: "USER" | "VENDOR" | "SYSTEM";
  body: string;
  createdAt: string;
}

export interface InquiryDetailContract extends InquiryListItem {
  description?: string;
  category?: PublicCategory | null;
  serviceCity?: PublicCity | null;
  messages: InquiryMessageContract[];
  statusHistory: Array<{
    fromStatus?: InquiryStatus | null;
    toStatus: InquiryStatus;
    actorType: "USER" | "VENDOR" | "SYSTEM" | "ADMIN";
    reason?: string | null;
    createdAt: string;
  }>;
  actions: { canWithdraw: boolean; canClose: boolean; canMessage: boolean };
  vendorAvailability: "AVAILABLE" | "SUSPENDED";
}

export interface NotificationContract {
  id: string;
  type: string;
  title: string;
  body: string;
  inquiryId?: string | null;
  readAt?: string | null;
  createdAt: string;
}
