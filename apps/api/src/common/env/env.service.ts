import { Injectable } from "@nestjs/common";
import { z } from "zod";

const envSchema = z.object({
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
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),
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
