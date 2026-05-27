"use client";

import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { format } from "date-fns";
import {
  ActivityIcon,
  CreditCardIcon,
  CrownIcon,
  FileTextIcon,
  IndianRupeeIcon,
  LayoutDashboardIcon,
  UsersIcon,
} from "lucide-react";

type PlanId = "FREE" | "STARTER" | "PRO" | "BUSINESS";

const PLAN_LABELS: Record<PlanId, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
  BUSINESS: "Business",
};

const PLAN_PRICES: Record<Exclude<PlanId, "FREE">, number> = {
  STARTER: 99,
  PRO: 299,
  BUSINESS: 499,
};

function PlanBadge({ plan, active }: { plan: PlanId; active?: boolean }) {
  const styles: Record<PlanId, string> = {
    FREE: "bg-slate-100 text-slate-700 border-slate-200",
    STARTER: "bg-sky-50 text-sky-700 border-sky-200",
    PRO: "bg-violet-50 text-violet-700 border-violet-200",
    BUSINESS: "bg-amber-50 text-amber-800 border-amber-200",
  };

  return (
    <Badge variant="outline" className={`${styles[plan]} font-semibold`}>
      {PLAN_LABELS[plan]}
      {active === false ? " · Expired" : active ? " · Active" : ""}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "text-primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof UsersIcon;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminContent />
    </RequireAuth>
  );
}

function AdminContent() {
  const me = trpc.auth.me.useQuery();
  const isAdmin = me.data?.role === "ADMIN";

  const overview = trpc.admin.getOverview.useQuery(undefined, { enabled: isAdmin });
  const subscriptionOverview = trpc.admin.getSubscriptionOverview.useQuery(undefined, { enabled: isAdmin });
  const subscribers = trpc.admin.listSubscribers.useQuery(undefined, { enabled: isAdmin });
  const payments = trpc.admin.listPayments.useQuery(undefined, { enabled: isAdmin });
  const forms = trpc.admin.listForms.useQuery(undefined, { enabled: isAdmin });
  const activity = trpc.admin.getActivity.useQuery(undefined, { enabled: isAdmin });

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

  if (me.isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading admin dashboard...</div>;
  }

  if (!me.data || me.data.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <CrownIcon className="mx-auto h-10 w-10 text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Admin access required</h1>
        <p className="mt-2 text-sm text-slate-500">Your account does not have permission to view this page.</p>
      </div>
    );
  }

  const activeSubscribers = subscribers.data?.filter((s) => s.isActive) ?? [];
  const expiredSubscribers = subscribers.data?.filter((s) => !s.isActive) ?? [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <CrownIcon className="h-3.5 w-3.5" />
              Admin
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor subscriptions, payments, forms, and platform activity.
            </p>
          </div>
        </div>

        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList className="h-auto flex-wrap gap-1 bg-white p-1 shadow-sm border border-slate-200">
            <TabsTrigger value="subscriptions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <CreditCardIcon className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <LayoutDashboardIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="forms" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileTextIcon className="h-4 w-4" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <ActivityIcon className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Active subscribers"
                value={subscriptionOverview.data?.activeSubscribers ?? "—"}
                hint={`${subscriptionOverview.data?.expiredSubscribers ?? 0} expired`}
                icon={UsersIcon}
              />
              <StatCard
                label="Est. MRR"
                value={`₹${subscriptionOverview.data?.mrrEstimateInr ?? 0}`}
                hint="Based on active plans"
                icon={IndianRupeeIcon}
                accent="text-emerald-600"
              />
              <StatCard
                label="Revenue (30d)"
                value={`₹${subscriptionOverview.data?.revenue30dInr ?? 0}`}
                hint={`${subscriptionOverview.data?.payments30d ?? 0} payments`}
                icon={CreditCardIcon}
                accent="text-emerald-600"
              />
              <StatCard
                label="Total revenue"
                value={`₹${subscriptionOverview.data?.totalRevenueInr ?? 0}`}
                hint={`${subscriptionOverview.data?.totalPayments ?? 0} all-time payments`}
                icon={IndianRupeeIcon}
                accent="text-emerald-600"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(["STARTER", "PRO", "BUSINESS"] as const).map((plan) => (
                <div key={plan} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <PlanBadge plan={plan} active />
                    <span className="text-sm font-bold text-slate-900">₹{PLAN_PRICES[plan]}/mo</span>
                  </div>
                  <p className="mt-4 text-3xl font-black text-slate-900">
                    {subscriptionOverview.data?.byPlan[plan] ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">active subscribers</p>
                </div>
              ))}
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col gap-1 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Subscribed users</h2>
                  <p className="text-sm text-slate-500">Users who purchased a paid plan (active and expired).</p>
                </div>
                <Badge variant="secondary">{subscribers.data?.length ?? 0} total</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Forms</TableHead>
                    <TableHead>Total paid</TableHead>
                    <TableHead>Renews / expired</TableHead>
                    <TableHead>Last payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(subscribers.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                        No paid subscribers yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers.data?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <PlanBadge plan={user.plan} active={user.isActive} />
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600">
                              Expired
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.formCount} / {user.maxForms}
                        </TableCell>
                        <TableCell className="font-semibold">₹{user.totalPaidInr}</TableCell>
                        <TableCell className="text-sm text-slate-600" suppressHydrationWarning>
                          {user.planExpiresAt ? format(new Date(user.planExpiresAt), "PP") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600" suppressHydrationWarning>
                          {user.lastPaidAt ? format(new Date(user.lastPaidAt), "PP") : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col gap-1 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Payment history</h2>
                  <p className="text-sm text-slate-500">Recent Razorpay orders and their status.</p>
                </div>
                <Badge variant="secondary">{payments.data?.length ?? 0} records</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payments.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.data?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{payment.userName}</div>
                          <div className="text-xs text-slate-500">{payment.userEmail}</div>
                        </TableCell>
                        <TableCell>
                          <PlanBadge plan={payment.plan} />
                        </TableCell>
                        <TableCell className="font-semibold">₹{payment.amountInr}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              payment.status === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 capitalize"
                                : "capitalize"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 max-w-[140px] truncate">
                          {payment.razorpayOrderId}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600" suppressHydrationWarning>
                          {payment.paidAt
                            ? format(new Date(payment.paidAt), "PPp")
                            : format(new Date(payment.createdAt), "PPp")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <h3 className="font-bold text-emerald-900">Active now</h3>
                <p className="mt-1 text-2xl font-black text-emerald-800">{activeSubscribers.length}</p>
                <p className="mt-1 text-sm text-emerald-700">Users with a valid paid subscription.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-bold text-slate-900">Free users</h3>
                <p className="mt-1 text-2xl font-black text-slate-800">{subscriptionOverview.data?.freeUsers ?? 0}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {expiredSubscribers.length} users had a plan that expired.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total users" value={overview.data?.totals.users ?? "—"} icon={UsersIcon} />
              <StatCard label="Total forms" value={overview.data?.totals.forms ?? "—"} icon={FileTextIcon} />
              <StatCard label="Published forms" value={overview.data?.totals.publishedForms ?? "—"} icon={FileTextIcon} />
              <StatCard
                label="Submissions (30d)"
                value={overview.data?.totals.submissions30d ?? "—"}
                icon={ActivityIcon}
              />
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-3">
            {(forms.data ?? []).map((form) => (
              <div key={form.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{form.title}</div>
                  <div className="text-xs text-slate-500">{form.status}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => moderate.mutate({ formId: form.id, action: "UNPUBLISH" })}>
                    Unpublish
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => moderate.mutate({ formId: form.id, action: "ARCHIVE" })}>
                    Archive
                  </Button>
                  {form.isTemplate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => feature.mutate({ formId: form.id, isFeatured: !form.isFeatured })}
                    >
                      {form.isFeatured ? "Unfeature" : "Feature"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="activity">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">Recent activity</h2>
                <span className="text-xs text-slate-500">Last 50 actions</span>
              </div>
              <div className="divide-y divide-slate-100">
                {activity.data && activity.data.length === 0 && (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">No admin activity yet.</div>
                )}
                {(activity.data ?? []).map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{item.action}</div>
                      <div className="text-xs text-slate-500">
                        {item.actor.name} ({item.actor.email})
                        {item.form ? ` · ${item.form.title}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500" suppressHydrationWarning>
                      {format(new Date(item.createdAt), "PPpp")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
