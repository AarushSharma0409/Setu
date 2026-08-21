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
});

export const adminEnv = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
