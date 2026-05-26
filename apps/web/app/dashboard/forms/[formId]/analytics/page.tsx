"use client";

import { use, useMemo, useState } from "react";
import { format } from "date-fns";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  CalendarRangeIcon,
  ClipboardListIcon,
  EyeIcon,
  Loader2Icon,
  PlayIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRouter } from "next/navigation";

const rangeOptions = [7, 14, 30, 90];

export default function AnalyticsPage({ params }: { params: Promise<{ formId: string }> }) {
  return (
    <RequireAuth>
      <AnalyticsContent params={params} />
    </RequireAuth>
  );
}

function AnalyticsContent({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const [rangeDays, setRangeDays] = useState(30);
  const router = useRouter();

  const { data, isLoading } = trpc.form.getAnalyticsOverview.useQuery({
    formId,
    rangeDays,
  });

  const series = useMemo(() => {
    if (!data?.series) return [];
    return data.series.map((point) => ({
      ...point,
      label: format(new Date(point.date), "MMM d"),
    }));
  }, [data?.series]);

  const fieldData = useMemo(() => {
    if (!data?.fields) return [];
    return data.fields.map((field) => ({
      name: field.label,
      completionRate: Math.round(field.completionRate * 100),
      answeredCount: field.answeredCount,
      required: field.required,
    }));
  }, [data?.fields]);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-mono tracking-wider">Loading analytics...</span>
        </div>
      </div>
    );
  }

  const { form, totals, conversion, recentResponses } = data;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer hover:shadow-sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Form Analytics</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">{form.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-500">
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200 font-mono text-xs">/f/{form.slug}</span>
                <span className="capitalize">{form.visibility.toLowerCase()}</span>
                <span className="hidden sm:inline">&bull;</span>
                <span className="capitalize">{form.status.toLowerCase()}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              <CalendarRangeIcon className="h-4 w-4 text-slate-400" />
              <span>Last {rangeDays} days</span>
            </div>
            <Select value={String(rangeDays)} onValueChange={(value) => setRangeDays(Number(value))}>
              <SelectTrigger className="h-9 w-36 rounded-xl border-slate-200 bg-white text-slate-700 font-medium shadow-sm transition-all cursor-pointer hover:bg-slate-50">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {rangeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)} className="cursor-pointer rounded-lg">
                    Last {option} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-xl transition-all cursor-pointer hover:bg-slate-50 hover:shadow-sm shadow-sm font-semibold border-slate-200 bg-white"
              onClick={() => router.push(`/dashboard/forms/${form.id}/responses`)}
            >
              <ClipboardListIcon className="h-4 w-4 text-slate-500" />
              Responses
            </Button>
            <Button
              className="h-9 gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm hover:shadow-md font-semibold"
              onClick={() => router.push(`/builder/${form.id}`)}
            >
              <SparklesIcon className="h-4 w-4" />
              Edit Form
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
          <div className="grid gap-6 md:grid-cols-4 lg:col-span-2">
            <MetricCard icon={EyeIcon} label="Views" value={totals.views} trend="Audience" colorTheme="blue" />
            <MetricCard icon={PlayIcon} label="Starts" value={totals.starts} trend="Engaged" colorTheme="violet" />
            <MetricCard icon={ClipboardListIcon} label="Submits" value={totals.submits} trend="Completed" colorTheme="emerald" />
            <MetricCard
              icon={TargetIcon}
              label="View to submit"
              value={`${Math.round(conversion.viewToSubmit * 100)}%`}
              trend="Conversion"
              colorTheme="orange"
            />
          </div>

          <Card className="border-0 ring-1 ring-slate-900/5 shadow-md rounded-2xl bg-white overflow-hidden lg:col-span-1">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 px-6 pt-5">
              <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                <div className="p-1.5 rounded-lg bg-indigo-100/50">
                  <TrendingUpIcon className="h-5 w-5 text-indigo-600" />
                </div>
                Activity Pulse
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                Daily views, starts, and submits for the selected window.
              </CardDescription>
            </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="startsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="submitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 12,
                    color: "#0f172a",
                  }}
                  labelStyle={{ color: "#0f172a" }}
                  itemStyle={{ color: "#0f172a" }}
                />
                <Area type="monotone" dataKey="views" stroke="var(--chart-1)" fill="url(#viewsGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="starts" stroke="var(--chart-2)" fill="url(#startsGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="submits" stroke="var(--chart-4)" fill="url(#submitsGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

          <Card className="border-0 ring-1 ring-slate-900/5 shadow-md rounded-2xl bg-white overflow-hidden lg:col-span-1">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 px-6 pt-5">
              <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                <div className="p-1.5 rounded-lg bg-emerald-100/50">
                  <BarChart3Icon className="h-5 w-5 text-emerald-600" />
                </div>
                Field Completion
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                Which questions respondents finish most often.
              </CardDescription>
            </CardHeader>
          <CardContent className="h-72">
            {fieldData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Add fields to start tracking completion.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fieldData} layout="vertical" margin={{ left: 24, right: 12 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 12,
                      color: "#0f172a",
                    }}
                    labelStyle={{ color: "#0f172a" }}
                    itemStyle={{ color: "#0f172a" }}
                  />
                  <Bar dataKey="completionRate" fill="var(--chart-2)" radius={[6, 6, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <Card className="border-0 ring-1 ring-slate-900/5 shadow-md rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 px-6 pt-5">
              <CardTitle className="text-lg font-bold text-slate-900">Completion Funnel</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                View how many visitors become responders.
              </CardDescription>
            </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ left: 0, right: 8 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 12,
                    color: "#0f172a",
                  }}
                  labelStyle={{ color: "#0f172a" }}
                  itemStyle={{ color: "#0f172a" }}
                />
                <Bar dataKey="views" stackId="a" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="starts" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="submits" stackId="a" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

          <Card className="border-0 ring-1 ring-slate-900/5 shadow-md rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 px-6 pt-5">
              <CardTitle className="text-lg font-bold text-slate-900">Recent Responses</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                Latest submissions with respondent hints.
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            {recentResponses.length === 0 ? (
              <div className="text-sm text-slate-500">No responses yet.</div>
            ) : (
              recentResponses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {response.respondentName || response.respondentEmail || "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-500" suppressHydrationWarning>
                      {format(new Date(response.submittedAt), "PPpp")}
                    </p>
                    <div className="mt-2 space-y-1">
                      {response.answers.slice(0, 2).map((answer) => (
                        <p key={`${response.id}-${answer.fieldId}`} className="text-xs text-slate-600">
                          <span className="font-medium text-slate-800">{answer.label}:</span>{" "}
                          {formatValue(answer.value)}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{response.itemCount}</p>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">answers</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  colorTheme = "blue",
}: {
  icon: typeof EyeIcon;
  label: string;
  value: number | string;
  trend: string;
  colorTheme?: "blue" | "violet" | "emerald" | "orange";
}) {
  const themeStyles = {
    blue: "bg-blue-50/50 text-blue-600 ring-blue-500/20",
    violet: "bg-violet-50/50 text-violet-600 ring-violet-500/20",
    emerald: "bg-emerald-50/50 text-emerald-600 ring-emerald-500/20",
    orange: "bg-orange-50/50 text-orange-600 ring-orange-500/20",
  };

  const iconStyles = {
    blue: "text-blue-600",
    violet: "text-violet-600",
    emerald: "text-emerald-600",
    orange: "text-orange-600",
  };

  return (
    <Card className="group relative overflow-hidden border-0 ring-1 ring-slate-900/5 shadow-md rounded-2xl bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm transition-transform duration-300 group-hover:scale-110 ${themeStyles[colorTheme]}`}>
            <Icon className={`h-5 w-5 ${iconStyles[colorTheme]}`} />
          </div>
        </div>
        <div>
          <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">{value}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
