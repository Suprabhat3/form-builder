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
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Form analytics</p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{form.title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  /f/{form.slug} | {form.visibility.toLowerCase()} | {form.status.toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                <CalendarRangeIcon className="h-4 w-4" />
                <span>Last {rangeDays} days</span>
              </div>
              <Select value={String(rangeDays)} onValueChange={(value) => setRangeDays(Number(value))}>
                <SelectTrigger className="h-9 w-36 border-slate-200 bg-white text-slate-700">
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  {rangeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      Last {option} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => router.push(`/builder/${form.id}`)}
              >
                <SparklesIcon className="h-4 w-4" />
                Edit form
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => router.push(`/dashboard/forms/${form.id}/responses`)}
              >
                <ClipboardListIcon className="h-4 w-4" />
                Responses
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard icon={EyeIcon} label="Views" value={totals.views} trend="Audience" />
            <MetricCard icon={PlayIcon} label="Starts" value={totals.starts} trend="Engaged" />
            <MetricCard icon={ClipboardListIcon} label="Submits" value={totals.submits} trend="Completed" />
            <MetricCard
              icon={TargetIcon}
              label="View to submit"
              value={`${Math.round(conversion.viewToSubmit * 100)}%`}
              trend="Conversion"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[2fr_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <TrendingUpIcon className="h-5 w-5 text-indigo-500" />
              Activity pulse
            </CardTitle>
            <CardDescription>
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

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BarChart3Icon className="h-5 w-5 text-emerald-500" />
              Field completion
            </CardTitle>
            <CardDescription>
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
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Completion funnel</CardTitle>
            <CardDescription>
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

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Recent responses</CardTitle>
            <CardDescription>
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
                    <p className="text-xs text-slate-500">
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
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: typeof EyeIcon;
  label: string;
  value: number | string;
  trend: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-3 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{trend}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Icon className="h-5 w-5" />
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
