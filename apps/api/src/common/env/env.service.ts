import { Injectable } from "@nestjs/common";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    API_PORT: z.coerce.number().int().positive().default(4000),
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
    OBJECT_STORAGE_REGION: z.string().optional(),
    OBJECT_STORAGE_ACCESS_KEY_ID: z.string().optional(),
    OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
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
    SEED_PUBLIC_FIXTURES: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
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
        !values.OBJECT_STORAGE_REGION ||
        !values.OBJECT_STORAGE_ACCESS_KEY_ID ||
        !values.OBJECT_STORAGE_SECRET_ACCESS_KEY)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OBJECT_STORAGE_PROVIDER"],
        message:
          "S3 storage requires bucket, endpoint, region, and credentials",
      });
    }

    if (values.SEED_PUBLIC_FIXTURES) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SEED_PUBLIC_FIXTURES"],
        message: "development fixtures must be disabled in production",
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
