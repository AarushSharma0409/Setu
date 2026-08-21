import { isIP } from "node:net";

import { BadRequestException } from "@nestjs/common";

function isUnsafeIpAddress(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const family = isIP(host);
  if (family === 4) {
    const [first, second] = host.split(".").map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168)) ||
      (first === 198 && (second === 18 || second === 19))
    );
  }

  if (family === 6) {
    return (
      host === "::" ||
      host === "::1" ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("fe8") ||
      host.startsWith("fe9") ||
      host.startsWith("fea") ||
      host.startsWith("feb") ||
      host.startsWith("::ffff:")
    );
  }

  return false;
}

/** Validates admin-configured provider endpoints before any outbound use or redirect. */
export function trustedProviderUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException("Provider URL must be a valid HTTPS URL");
  }
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    isUnsafeIpAddress(host)
  ) {
    throw new BadRequestException(
      "Provider URL is not an approved public HTTPS destination",
    );
  }
  if (url.username || url.password || url.hash)
    throw new BadRequestException(
      "Provider URL must not contain credentials or fragments",
    );
  return url;
}

export function sameTrustedProviderHost(
  baseUrl: string,
  destination: string,
): URL {
  const base = trustedProviderUrl(baseUrl);
  const target = trustedProviderUrl(destination);
  if (base.hostname !== target.hostname || base.port !== target.port) {
    throw new BadRequestException(
      "Provider returned an untrusted redirect destination",
    );
  }
  return target;
}
