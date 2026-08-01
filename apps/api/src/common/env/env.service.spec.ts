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
        ADMIN_2FA_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        OBJECT_STORAGE_PROVIDER: "local",
      }),
    ).toThrow("local object storage is not allowed");
  });
});
