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
