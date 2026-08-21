import { redactForLog } from "./redaction";

describe("redactForLog", () => {
  it("redacts credential and health-sensitive keys recursively", () => {
    expect(
      redactForLog({
        authorization: "Bearer access-token",
        profile: { medicalAnswer: "sensitive value" },
        visible: "safe",
      }),
    ).toEqual({
      authorization: "[REDACTED]",
      profile: { medicalAnswer: "[REDACTED]" },
      visible: "safe",
    });
  });

  it("redacts bearer values and URL query strings in error text", () => {
    expect(
      redactForLog(
        "failed with Bearer secret-token at https://provider.example/path?state=secret",
      ),
    ).toBe(
      "failed with Bearer [REDACTED] at https://provider.example/path?[REDACTED]",
    );
  });
});
