import { validateApiEnv } from "./env.service";

const validEnv = {
  DATABASE_URL: "postgresql://setu:setu_local_password@localhost:5432/setu",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "local-access-secret-at-least-32-chars",
  JWT_REFRESH_SECRET: "local-refresh-secret-at-least-32-chars",
};

describe("validateApiEnv", () => {
  it("accepts a valid local environment", () => {
    expect(validateApiEnv(validEnv).API_PORT).toBe(4000);
  });

  it("fails with a readable message when secrets are weak", () => {
    expect(() =>
      validateApiEnv({
        ...validEnv,
        JWT_ACCESS_SECRET: "short",
      }),
    ).toThrow("Invalid API environment");
  });

  it("rejects local production defaults", () => {
    expect(() =>
      validateApiEnv({ ...validEnv, NODE_ENV: "production" }),
    ).toThrow("must be replaced with a production secret");
  });

  it("rejects local origins and storage in production", () => {
    expect(() =>
      validateApiEnv({
        ...validEnv,
        NODE_ENV: "production",
        JWT_ACCESS_SECRET: "production-access-secret-1234567890",
        JWT_REFRESH_SECRET: "production-refresh-secret-1234567890",
        ADMIN_AUTH_CHALLENGE_SECRET: "production-challenge-secret-1234567890",
        ADMIN_2FA_ENCRYPTION_KEY:
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        OBJECT_STORAGE_PROVIDER: "local",
      }),
    ).toThrow("local object storage is not allowed");
  });

  it("fails closed for insurance administration by default", () => {
    const env = validateApiEnv(validEnv);
    expect(env.INSURANCE_FEATURE_ENABLED).toBe(false);
    expect(env.INSURANCE_ADMIN_ENABLED).toBe(false);
    expect(env.INSURANCE_PRODUCT_CATALOG_ENABLED).toBe(false);
  });

  it("requires explicit provider hosts when integrations are enabled", () => {
    expect(() =>
      validateApiEnv({
        ...validEnv,
        NODE_ENV: "production",
        CORS_ALLOWED_ORIGINS: "https://setu.example",
        JWT_ACCESS_SECRET: "production-access-secret-1234567890",
        JWT_REFRESH_SECRET: "production-refresh-secret-1234567890",
        ADMIN_AUTH_CHALLENGE_SECRET: "production-challenge-secret-1234567890",
        ADMIN_2FA_ENCRYPTION_KEY:
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        OBJECT_STORAGE_PROVIDER: "s3",
        OBJECT_STORAGE_BUCKET: "setu-private",
        OBJECT_STORAGE_ENDPOINT: "https://s3.example",
        OBJECT_STORAGE_PUBLIC_ENDPOINT: "https://storage.setu.example",
        OBJECT_STORAGE_REGION: "ap-south-1",
        OBJECT_STORAGE_ACCESS_KEY_ID: "production-access-key",
        OBJECT_STORAGE_SECRET_ACCESS_KEY: "production-secret-key",
        INSURANCE_PROVIDER_INTEGRATIONS_ENABLED: "true",
      }),
    ).toThrow("must list approved provider hosts");
  });

  it("requires an explicit approval gate for production insurance features", () => {
    const productionEnv = {
      ...validEnv,
      NODE_ENV: "production",
      CORS_ALLOWED_ORIGINS: "https://setu.example",
      JWT_ACCESS_SECRET: "production-access-secret-1234567890",
      JWT_REFRESH_SECRET: "production-refresh-secret-1234567890",
      ADMIN_AUTH_CHALLENGE_SECRET: "production-challenge-secret-1234567890",
      ADMIN_2FA_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      OBJECT_STORAGE_PROVIDER: "s3",
      OBJECT_STORAGE_BUCKET: "setu-private",
      OBJECT_STORAGE_ENDPOINT: "https://s3.example",
      OBJECT_STORAGE_PUBLIC_ENDPOINT: "https://storage.setu.example",
      OBJECT_STORAGE_REGION: "ap-south-1",
      OBJECT_STORAGE_ACCESS_KEY_ID: "production-access-key",
      OBJECT_STORAGE_SECRET_ACCESS_KEY: "production-secret-key",
      MAIL_ENABLED: "true",
      SMTP_HOST: "smtp.setu.example",
      SMTP_PORT: "587",
      SMTP_USER: "smtp-user",
      SMTP_PASSWORD: "smtp-password",
      MAIL_FROM_ADDRESS: "notifications@setu.example",
      PUBLIC_SITE_URL: "https://setu.example",
      ADMIN_SITE_URL: "https://admin.setu.example",
      ADMIN_NOTIFICATION_EMAIL: "operations@setu.example",
      DOCUMENT_SCAN_ENABLED: "true",
      DOCUMENT_SCAN_FAIL_CLOSED: "true",
      CLAMAV_HOST: "clamav",
      INSURANCE_FEATURE_ENABLED: "true",
    };

    expect(() => validateApiEnv(productionEnv)).toThrow(
      "must be true before enabling insurance features",
    );
    expect(
      validateApiEnv({
        ...productionEnv,
        INSURANCE_PRODUCTION_APPROVED: "true",
      }).INSURANCE_FEATURE_ENABLED,
    ).toBe(true);
  });
});
