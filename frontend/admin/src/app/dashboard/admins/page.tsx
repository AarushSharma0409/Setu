"use client";

import { Button, Card, ErrorState, LoadingState, PageContainer, PageHeader, StatusBadge } from "@setu/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import { ProtectedShell } from "../../../components/protected-shell";
import { AdminApiClientError, adminApi } from "../../../lib/admin-api-client";

export default function AdminUsersPage() {
  const token = typeof window === "undefined" ? null : sessionStorage.getItem("setu_admin_access_token");
  const client = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin-users"], enabled: Boolean(token), queryFn: () => adminApi.adminUsers(token ?? "") });
  const create = useMutation({
    mutationFn: (input: { email: string; password: string; role: string }) => adminApi.createAdminUser(token ?? "", input),
    onSuccess: () => { setMessage("Administrator created. Their first sign-in will require TOTP enrolment."); setError(null); void client.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (value) => setError(readError(value)),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    create.mutate({ email: readField(data, "email"), password: readField(data, "password"), role: readField(data, "role") || "REVIEWER" });
  }

  return <PageContainer><ProtectedShell>
    <PageHeader eyebrow="Privileged access" title="Administrator access" description="Only super administrators can create, change, or disable internal accounts. There is no public administrator registration." />
    {query.isLoading ? <LoadingState label="Loading administrator accounts" /> : null}
    {query.isError ? <ErrorState title="Administrator access unavailable" detail="This area is available only to super administrators." /> : null}
    {query.data ? <section className="setu-admin-management-grid">
      <Card className="setu-admin-management-list"><div className="setu-admin-management-list-heading"><div><p className="setu-admin-dashboard-kicker">Current access</p><h2>Internal administrators</h2></div><span>{query.data.items.length} accounts</span></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr><th className="px-4 py-3">Administrator</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">MFA</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last sign-in</th></tr></thead><tbody>{query.data.items.map((admin) => <tr key={admin.id}><td className="px-4 py-3 font-medium">{admin.email}</td><td className="px-4 py-3">{admin.role.replaceAll("_", " ")}</td><td className="px-4 py-3">{admin.twoFactorEnabled ? "Enabled" : "Required at first sign-in"}</td><td className="px-4 py-3"><StatusBadge status={admin.status} /></td><td className="px-4 py-3 text-slate-500">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "Never"}</td></tr>)}</tbody></table></div></Card>
      <Card className="setu-admin-form-card"><p className="setu-admin-dashboard-kicker">New internal account</p><h2 className="mt-2 text-xl font-semibold">Create administrator</h2><p className="mt-2 text-sm text-slate-600">Use a unique work email and a 12+ character password with a letter and number.</p>
        <form className="setu-admin-form" onSubmit={submit}><label>Work email<input name="email" type="email" required /></label><label>Temporary password<input name="password" type="password" minLength={12} required /></label><label>Role<select defaultValue="REVIEWER" name="role"><option value="REVIEWER">Reviewer</option><option value="OPERATIONS">Operations</option><option value="SUPER_ADMIN">Super admin</option></select></label><Button className="w-full" disabled={create.isPending} type="submit">{create.isPending ? "Creating…" : "Create administrator"}</Button></form>
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}{error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </section> : null}
  </ProtectedShell></PageContainer>;
}

function readError(value: unknown) { return value instanceof AdminApiClientError ? value.message : "The request could not be completed."; }
function readField(data: FormData, name: string) { const value = data.get(name); return typeof value === "string" ? value : ""; }
