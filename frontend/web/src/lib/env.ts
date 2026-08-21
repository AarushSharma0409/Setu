import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .refine(
      (value) =>
        value === "/api/v1" || z.string().url().safeParse(value).success,
      "must be an absolute URL or /api/v1",
    )
    .default("http://localhost:4000/api/v1"),
  NEXT_PUBLIC_WEB_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  NEXT_PUBLIC_SUPPORT_EMAIL: z
    .string()
    .trim()
    .email()
    .optional()
    .transform((value) => value || undefined),
  NEXT_PUBLIC_SUPPORT_PHONE: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
});

export const webEnv = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID:
    process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  NEXT_PUBLIC_SUPPORT_PHONE: process.env.NEXT_PUBLIC_SUPPORT_PHONE,
});
