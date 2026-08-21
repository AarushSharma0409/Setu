"use client";

import { Button, Card, ErrorState, LoadingState, PageContainer, PageHeader } from "@setu/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ProtectedShell } from "../../../components/protected-shell";
import { AdminApiClientError, adminApi } from "../../../lib/admin-api-client";

export default function SecurityPage() {
  const token = typeof window === "undefined" ? null : sessionStorage.getItem("setu_admin_access_token");
  const router = useRouter(); const client = useQueryClient(); const [message, setMessage] = useState<string | null>(null); const [codes, setCodes] = useState<string[]>([]); const [error, setError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin-security"], enabled: Boolean(token), queryFn: () => adminApi.security(token ?? "") });
  const password = useMutation({ mutationFn: (input: { currentPassword: string; newPassword: string }) => adminApi.changePassword(token ?? "", input), onSuccess: async () => { await adminApi.logout(); sessionStorage.removeItem("setu_admin_access_token"); router.replace("/login"); }, onError: fail });
  const recovery = useMutation({ mutationFn: (code: string) => adminApi.regenerateRecoveryCodes(token ?? "", code), onSuccess: (result) => { setCodes(result.recoveryCodes); setMessage("New recovery codes generated. Save them offline now; they will not be shown again."); setError(null); void client.invalidateQueries({ queryKey: ["admin-security"] }); }, onError: fail });
  const sessions = useMutation({ mutationFn: () => adminApi.revokeAllSessions(token ?? ""), onSuccess: async () => { await adminApi.logout(); sessionStorage.removeItem("setu_admin_access_token"); router.replace("/login"); }, onError: fail });
  function fail(value: unknown) { setError(value instanceof AdminApiClientError ? value.message : "The request could not be completed."); }
  function submitPassword(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); password.mutate({ currentPassword: readField(data, "currentPassword"), newPassword: readField(data, "newPassword") }); }
  function submitRecovery(event: FormEvent<HTMLFormElement>) { event.preventDefault(); recovery.mutate(readField(new FormData(event.currentTarget), "code")); }
  return <PageContainer><ProtectedShell><PageHeader eyebrow="Session protection" title="Account security" description="Review your protected session, keep recovery codes current, and end every active session when required." />
    {query.isLoading ? <LoadingState label="Loading account security" /> : null}{query.isError ? <ErrorState title="Security details unavailable" detail="Refresh your sign-in and try again." /> : null}
    {query.data ? <div className="setu-admin-security-grid"><Card className="setu-admin-security-card"><p className="setu-admin-dashboard-kicker">Identity</p><h2 className="mt-2 text-xl font-semibold">{query.data.admin.email}</h2><dl className="setu-admin-security-list"><div><dt>Role</dt><dd>{query.data.admin.role.replaceAll("_", " ")}</dd></div><div><dt>Two-factor authentication</dt><dd>{query.data.admin.twoFactorEnabled ? "Enabled" : "Required"}</dd></div><div><dt>Active sessions</dt><dd>{query.data.activeSessions}</dd></div><div><dt>Unused recovery codes</dt><dd>{query.data.recoveryCodesRemaining}</dd></div></dl><Button className="mt-6" disabled={sessions.isPending} onClick={() => sessions.mutate()} type="button" variant="outline">Sign out on all devices</Button></Card>
    <Card className="setu-admin-form-card"><p className="setu-admin-dashboard-kicker">Password</p><h2 className="mt-2 text-xl font-semibold">Change password</h2><form className="setu-admin-form" onSubmit={submitPassword}><label>Current password<input name="currentPassword" required type="password" /></label><label>New password<input minLength={12} name="newPassword" required type="password" /></label><Button disabled={password.isPending} type="submit">Change and sign out</Button></form></Card>
    <Card className="setu-admin-security-card setu-admin-security-card-recovery"><p className="setu-admin-dashboard-kicker">Recovery</p><h2 className="mt-2 text-xl font-semibold">Replace recovery codes</h2><p className="mt-2 text-sm text-slate-600">Confirm with your authenticator-app code. This invalidates every previous recovery code.</p><form className="setu-admin-inline-form" onSubmit={submitRecovery}><input inputMode="numeric" name="code" placeholder="6-digit code" required /><Button disabled={recovery.isPending} type="submit">Generate</Button></form>{codes.length ? <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-white">{codes.join("\n")}</pre> : null}</Card>
    </div> : null}{message ? <p className="mt-5 text-sm text-emerald-700">{message}</p> : null}{error ? <p className="mt-5 text-sm text-rose-700">{error}</p> : null}
  </ProtectedShell></PageContainer>;
}

function readField(data: FormData, name: string) { const value = data.get(name); return typeof value === "string" ? value : ""; }
