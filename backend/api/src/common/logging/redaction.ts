const SENSITIVE_KEY_PATTERN =
  /password|token|secret|authorization|cookie|mfa|totp|recovery|medical|health|answer|consent|signature|credential|api[_-]?key|signed[_-]?url|state/i;

/** Removes credential and insurance-sensitive values before they reach logs. */
export function redactForLog(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactForLog(value.message),
    };
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .replace(/(Bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
      .replace(/(https?:\/\/[^\s?]+)\?[^\s]+/gi, "$1?[REDACTED]");
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : redactForLog(item),
      ]),
    );
  }

  return "[unserializable]";
}
