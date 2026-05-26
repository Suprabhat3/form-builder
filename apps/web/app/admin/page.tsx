"use client";

import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminContent />
    </RequireAuth>
  );
}

function AdminContent() {
  const me = trpc.auth.me.useQuery();
  const overview = trpc.admin.getOverview.useQuery(undefined, { enabled: me.data?.role === "ADMIN" });
  const forms = trpc.admin.listForms.useQuery(undefined, { enabled: me.data?.role === "ADMIN" });
  const activity = trpc.admin.getActivity.useQuery(undefined, { enabled: me.data?.role === "ADMIN" });
  const moderate = trpc.admin.moderateForm.useMutation({
    onSuccess: () => {
      forms.refetch();
      activity.refetch();
    },
  });
  const feature = trpc.admin.featureTemplate.useMutation({
    onSuccess: () => {
      forms.refetch();
      activity.refetch();
    },
  });

  if (me.isLoading || (me.data?.role === "ADMIN" && (overview.isLoading || forms.isLoading || activity.isLoading))) {
    return <div className="p-8">Loading admin dashboard...</div>;
  }
  if (!me.data || me.data.role !== "ADMIN") {
    return <div className="p-8">Admin access required.</div>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4"><div className="text-xs text-slate-500">Users</div><div className="text-2xl font-bold">{overview.data?.totals.users ?? 0}</div></div>
        <div className="border rounded-xl p-4"><div className="text-xs text-slate-500">Forms</div><div className="text-2xl font-bold">{overview.data?.totals.forms ?? 0}</div></div>
        <div className="border rounded-xl p-4"><div className="text-xs text-slate-500">Published</div><div className="text-2xl font-bold">{overview.data?.totals.publishedForms ?? 0}</div></div>
        <div className="border rounded-xl p-4"><div className="text-xs text-slate-500">Submissions (30d)</div><div className="text-2xl font-bold">{overview.data?.totals.submissions30d ?? 0}</div></div>
      </div>
      <div className="space-y-3">
        {(forms.data ?? []).map((form) => (
          <div key={form.id} className="border rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{form.title}</div>
              <div className="text-xs text-slate-500">{form.status}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => moderate.mutate({ formId: form.id, action: "UNPUBLISH" })}>Unpublish</Button>
              <Button variant="outline" size="sm" onClick={() => moderate.mutate({ formId: form.id, action: "ARCHIVE" })}>Archive</Button>
              {form.isTemplate && (
                <Button variant="outline" size="sm" onClick={() => feature.mutate({ formId: form.id, isFeatured: !form.isFeatured })}>
                  {form.isFeatured ? "Unfeature" : "Feature"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <span className="text-xs text-slate-500">Last 50 actions</span>
        </div>
        {activity.data && activity.data.length === 0 && (
          <div className="text-sm text-slate-500">No admin activity yet.</div>
        )}
        <div className="space-y-2">
          {(activity.data ?? []).map((item) => (
            <div key={item.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border rounded-lg p-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-800">{item.action}</div>
                <div className="text-xs text-slate-500">
                  {item.actor.name} ({item.actor.email})
                  {item.form ? ` • ${item.form.title}` : ""}
                </div>
              </div>
              <div className="text-xs text-slate-500" suppressHydrationWarning>
                {format(new Date(item.createdAt), "PPpp")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

