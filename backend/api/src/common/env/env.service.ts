import { Injectable } from "@nestjs/common";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    API_PORT: z.coerce.number().int().positive().default(4000),
    PUBLIC_WEB_URL: z.string().url().optional(),
    PUBLIC_SITE_URL: z.string().url().optional(),
    ADMIN_SITE_URL: z.string().url().optional(),
    MAIL_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    SMTP_HOST: z.string().trim().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    SMTP_USER: z.string().trim().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_CONNECTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(10_000),
    SMTP_GREETING_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(10_000),
    SMTP_SOCKET_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
    MAIL_FROM_ADDRESS: z.string().trim().email().optional(),
    ADMIN_NOTIFICATION_EMAIL: z.string().trim().email().optional(),
    GOOGLE_OAUTH_CLIENT_ID: z.string().trim().optional(),
    MSG91_OTP_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    MSG91_AUTH_KEY: z.string().trim().optional(),
    MSG91_OTP_TEMPLATE_ID: z.string().trim().optional(),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL: z.string().default("7d"),
    CORS_ALLOWED_ORIGINS: z
      .string()
      .default("http://localhost:3000,http://localhost:3001")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    OBJECT_STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
    OBJECT_STORAGE_LOCAL_DIR: z.string().default(".local-storage"),
    OBJECT_STORAGE_BUCKET: z.string().optional(),
    OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),
    OBJECT_STORAGE_PUBLIC_ENDPOINT: z.string().url().optional(),
    OBJECT_STORAGE_REGION: z.string().optional(),
    OBJECT_STORAGE_ACCESS_KEY_ID: z.string().optional(),
    OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
    S3_FORCE_PATH_STYLE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    DOCUMENT_MAX_FILE_SIZE_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(10 * 1024 * 1024),
    DOCUMENT_ALLOWED_MIME_TYPES: z
      .string()
      .default("application/pdf,image/jpeg,image/png")
      .transform((value) =>
        value
          .split(",")
          .map((mimeType) => mimeType.trim())
          .filter(Boolean),
      ),
    SIGNED_URL_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .max(300)
      .default(300),
    DOCUMENT_SCAN_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    DOCUMENT_SCAN_FAIL_CLOSED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    CLAMAV_HOST: z.string().trim().default("clamav"),
    CLAMAV_PORT: z.coerce.number().int().min(1).max(65535).default(3310),
    DOCUMENT_SCAN_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .default(30_000),
    ADMIN_2FA_ENCRYPTION_KEY: z
      .string()
      .default("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=")
      .refine((value) => {
        try {
          return Buffer.from(value, "base64").length === 32;
        } catch {
          return false;
        }
      }, "must be a base64-encoded 32-byte key"),
    ADMIN_AUTH_CHALLENGE_SECRET: z
      .string()
      .min(32)
      .default("setu-local-admin-auth-challenge-secret-at-least-32-chars"),
    ADMIN_AUTH_CHALLENGE_TTL: z.string().default("5m"),
    ADMIN_TOTP_ISSUER: z.string().min(1).default("Setu"),
    ADMIN_TOTP_WINDOW: z.coerce.number().int().min(0).max(2).default(1),
    ADMIN_LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    ADMIN_LOGIN_LOCKOUT_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(300),
    ADMIN_2FA_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    ADMIN_DOCUMENT_URL_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .max(300)
      .default(120),
    INQUIRY_IDEMPOTENCY_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(900),
    JSON_BODY_LIMIT: z.string().default("1mb"),
    REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
    RATE_LIMIT_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    RATE_LIMIT_REDIS_PREFIX: z.string().default("setu:ratelimit:"),
    RATE_LIMIT_AUTH_LIMIT: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_AUTH_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(60),
    RATE_LIMIT_INQUIRY_LIMIT: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_INQUIRY_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(60),
    RATE_LIMIT_UPLOAD_LIMIT: z.coerce.number().int().positive().default(5),
    RATE_LIMIT_UPLOAD_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(300),
    ADMIN_QUOTE_NOTIFICATION_EMAIL: z
      .union([z.string().trim().email(), z.literal("")])
      .optional()
      .transform((value) => value || undefined),
    SEED_PUBLIC_FIXTURES: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_FEATURE_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_PRODUCTION_APPROVED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_ADMIN_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_PRODUCT_CATALOG_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_CUSTOMER_NEEDS_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_QUOTATION_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_COMPARISON_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_RANKING_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_SAVED_QUOTES_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_PROVIDER_INTEGRATIONS_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_PURCHASE_HANDOFF_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_PROVIDER_DEFAULT_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(500)
      .max(60_000)
      .default(8_000),
    INSURANCE_PROVIDER_MAX_RETRIES: z.coerce
      .number()
      .int()
      .min(0)
      .max(3)
      .default(1),
    INSURANCE_PROVIDER_ALLOWED_HOSTS: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((host) => host.trim().toLowerCase())
          .filter(Boolean),
      ),
    INSURANCE_HANDOFF_TTL_MINUTES: z.coerce
      .number()
      .int()
      .min(5)
      .max(30)
      .default(15),
    INSURANCE_WEBHOOK_MAX_BODY_BYTES: z.coerce
      .number()
      .int()
      .min(1_024)
      .max(1_048_576)
      .default(65_536),
    INSURANCE_OPERATIONS_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_OPERATIONS_RETRY_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_CALLBACK_REPROCESS_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    INSURANCE_OPERATIONS_DEFAULT_WINDOW_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(720)
      .default(24),
    INSURANCE_EXPIRY_WARNING_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(365)
      .default(30),
    INSURANCE_QUOTE_TTL_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(90)
      .default(14),
    INSURANCE_NEED_ASSESSMENT_DRAFT_TTL_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(365)
      .default(30),
    INSURANCE_MAX_COVERED_MEMBERS: z.coerce
      .number()
      .int()
      .min(1)
      .max(10)
      .default(6),
    INSURANCE_SENSITIVE_DATA_ENCRYPTION_KEY: z
      .string()
      .min(44)
      .default("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="),
    INSURANCE_DOCUMENT_MAX_FILE_SIZE_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(10 * 1024 * 1024),
    INSURANCE_DOCUMENT_ALLOWED_MIME_TYPES: z
      .string()
      .default("application/pdf,image/jpeg,image/png")
      .transform((value) =>
        value
          .split(",")
          .map((mimeType) => mimeType.trim())
          .filter(Boolean),
      ),
    INSURANCE_SIGNED_URL_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .max(300)
      .default(120),
    INSURANCE_LICENCE_EXPIRY_WARNING_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(365)
      .default(60),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== "production") return;

    const unsafeSecrets = new Set([
      "change-me-local-access-secret-at-least-32-chars",
      "change-me-local-refresh-secret-at-least-32-chars",
      "setu-local-admin-auth-challenge-secret-at-least-32-chars",
      "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
    ]);

    for (const [name, value] of [
      ["JWT_ACCESS_SECRET", values.JWT_ACCESS_SECRET],
      ["JWT_REFRESH_SECRET", values.JWT_REFRESH_SECRET],
      ["ADMIN_AUTH_CHALLENGE_SECRET", values.ADMIN_AUTH_CHALLENGE_SECRET],
      ["ADMIN_2FA_ENCRYPTION_KEY", values.ADMIN_2FA_ENCRYPTION_KEY],
    ] as const) {
      if (unsafeSecrets.has(value)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name],
          message: "must be replaced with a production secret",
        });
      }
    }

    if (
      values.CORS_ALLOWED_ORIGINS.some((origin) =>
        /localhost|127\.0\.0\.1/i.test(origin),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ALLOWED_ORIGINS"],
        message: "must not contain local development origins in production",
      });
    }

    if (
      values.INSURANCE_PROVIDER_INTEGRATIONS_ENABLED &&
      values.INSURANCE_PROVIDER_ALLOWED_HOSTS.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["INSURANCE_PROVIDER_ALLOWED_HOSTS"],
        message:
          "must list approved provider hosts when provider integrations are enabled",
      });
    }

    if (values.OBJECT_STORAGE_PROVIDER === "local") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OBJECT_STORAGE_PROVIDER"],
        message: "local object storage is not allowed in production",
      });
    }

    if (
      values.OBJECT_STORAGE_PROVIDER === "s3" &&
      (!values.OBJECT_STORAGE_BUCKET ||
        !values.OBJECT_STORAGE_ENDPOINT ||
        !values.OBJECT_STORAGE_PUBLIC_ENDPOINT ||
        !values.OBJECT_STORAGE_REGION ||
        !values.OBJECT_STORAGE_ACCESS_KEY_ID ||
        !values.OBJECT_STORAGE_SECRET_ACCESS_KEY)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OBJECT_STORAGE_PROVIDER"],
        message:
          "S3 storage requires bucket, internal/public endpoints, region, and credentials",
      });
    }

    if (values.SEED_PUBLIC_FIXTURES) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SEED_PUBLIC_FIXTURES"],
        message: "development fixtures must be disabled in production",
      });
    }

    if (
      values.DOCUMENT_SCAN_FAIL_CLOSED &&
      (!values.DOCUMENT_SCAN_ENABLED || !values.CLAMAV_HOST)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DOCUMENT_SCAN_ENABLED"],
        message:
          "production uploads require enabled ClamAV scanning and a scanner host",
      });
    }

    if (
      !values.MAIL_ENABLED ||
      !values.SMTP_HOST ||
      !values.SMTP_USER ||
      !values.SMTP_PASSWORD ||
      !values.MAIL_FROM_ADDRESS ||
      !values.PUBLIC_SITE_URL ||
      !values.ADMIN_SITE_URL ||
      !values.ADMIN_NOTIFICATION_EMAIL
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MAIL_ENABLED"],
        message:
          "MAIL_ENABLED plus SMTP credentials, MAIL_FROM_ADDRESS, PUBLIC_SITE_URL, ADMIN_SITE_URL, and ADMIN_NOTIFICATION_EMAIL are required in production",
      });
    }

    const anyInsuranceFeatureEnabled =
      values.INSURANCE_FEATURE_ENABLED ||
      values.INSURANCE_ADMIN_ENABLED ||
      values.INSURANCE_PRODUCT_CATALOG_ENABLED ||
      values.INSURANCE_CUSTOMER_NEEDS_ENABLED ||
      values.INSURANCE_QUOTATION_ENABLED ||
      values.INSURANCE_COMPARISON_ENABLED ||
      values.INSURANCE_RANKING_ENABLED ||
      values.INSURANCE_SAVED_QUOTES_ENABLED ||
      values.INSURANCE_PROVIDER_INTEGRATIONS_ENABLED ||
      values.INSURANCE_PURCHASE_HANDOFF_ENABLED ||
      values.INSURANCE_OPERATIONS_ENABLED ||
      values.INSURANCE_OPERATIONS_RETRY_ENABLED ||
      values.INSURANCE_CALLBACK_REPROCESS_ENABLED;

    if (anyInsuranceFeatureEnabled && !values.INSURANCE_PRODUCTION_APPROVED) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["INSURANCE_PRODUCTION_APPROVED"],
        message:
          "must be true before enabling insurance features in production",
      });
    }
  });

export type ApiEnv = z.infer<typeof envSchema>;

export function validateApiEnv(values: NodeJS.ProcessEnv): ApiEnv {
  const parsed = envSchema.safeParse(values);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid API environment: ${details}`);
  }

  return parsed.data;
}

@Injectable()
export class EnvService {
  private readonly env = validateApiEnv(process.env);

  get values(): ApiEnv {
    return this.env;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === "production";
  }

  get isDevelopmentLike(): boolean {
    return this.env.NODE_ENV !== "production";
  }
}
