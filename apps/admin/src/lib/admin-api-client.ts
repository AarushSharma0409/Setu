import type { ApiErrorBody } from "@setu/types";

import { adminEnv } from "./env";

export class AdminApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
  }
}

export interface AdminIdentity {
  id: string;
  email: string;
  role: string;
  status: string;
  twoFactorEnabled?: boolean;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${adminEnv.NEXT_PUBLIC_API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = await readJson<ApiErrorBody>(response);
    throw new AdminApiClientError(
      body?.message ?? "Admin API request failed",
      response.status,
      body ?? undefined,
    );
  }

  return (await readJson<T>(response)) ?? ({} as T);
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

export const adminApi = {
  login: (input: { email: string; password: string }) =>
    request<
      | {
          accessToken: string;
          refreshToken: string;
          admin: AdminIdentity;
          twoFactorRequired: false;
        }
      | { twoFactorRequired: true; message: string }
    >("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  me: (accessToken: string) =>
    request<{ admin: AdminIdentity }>("/admin/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  systemStatus: (accessToken: string) =>
    request<{
      application: string;
      checkedAt: string;
      health: { status: string; dependencies: Record<string, string> };
    }>("/admin/system-status", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  refresh: () =>
    request<{ accessToken: string; admin: AdminIdentity }>(
      "/admin/auth/refresh",
      { method: "POST", body: "{}" },
    ),
  logout: () =>
    request<{ ok: boolean }>("/admin/auth/logout", {
      method: "POST",
      body: "{}",
    }),
};
