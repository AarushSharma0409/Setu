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
});
