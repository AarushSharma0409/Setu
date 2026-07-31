import type { Request } from "express";

export type AuthSubjectType = "public" | "admin";

export interface AuthenticatedPrincipal {
  sub: string;
  email?: string;
  phone?: string;
  role: string;
  type: AuthSubjectType;
}

export type AuthenticatedRequest = Request & {
  auth?: AuthenticatedPrincipal;
};
