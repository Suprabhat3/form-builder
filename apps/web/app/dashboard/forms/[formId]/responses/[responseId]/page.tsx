"use client";

import { use, useMemo } from "react";
import { format } from "date-fns";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { ArrowLeftIcon, ClipboardListIcon, LineChartIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResponseDetailPage({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  return (
    <RequireAuth>
      <ResponseDetailContent params={params} />
    </RequireAuth>
  );
}

function ResponseDetailContent({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  const { formId, responseId } = use(params);
  const router = useRouter();

  const { data: form } = trpc.form.getById.useQuery({ formId });
  const { data, isLoading } = trpc.form.getResponseDetail.useQuery({ formId, responseId });

  const formattedItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((item) => ({
      ...item,
      formattedValue: formatValue(item.value),
    }));
  }, [data?.items]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading response...
      </div>
    );
  }

  if (!data || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Response not found.
      </div>
    );
  }

  const respondentLabel =
    data.response.respondentName || data.response.respondentEmail || "Anonymous";

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer hover:shadow-sm"
              onClick={() => router.push(`/dashboard/forms/${formId}/responses`)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Response Detail</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">{form.title}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200 font-mono text-xs">/f/{form.slug}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-xl transition-all cursor-pointer hover:bg-slate-50 hover:shadow-sm shadow-sm font-semibold border-slate-200 bg-white"
              onClick={() => router.push(`/dashboard/forms/${formId}/analytics`)}
            >
              <LineChartIcon className="h-4 w-4 text-slate-500" />
              View Analytics
            </Button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card className="border-0 ring-1 ring-slate-900/5 shadow-md rounded-2xl bg-white overflow-hidden h-fit">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 px-6 pt-5">
              <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                <div className="p-1.5 rounded-lg bg-indigo-100/50">
                  <ClipboardListIcon className="h-5 w-5 text-indigo-600" />
                </div>
                Submission Profile
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                Captured details about this respondent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-slate-600 p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Respondent</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 font-bold text-lg ring-1 ring-indigo-200/50 shadow-sm">
                    {(data.response.respondentName?.[0] || data.response.respondentEmail?.[0] || "A").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">{respondentLabel}</p>
                    <p className="text-xs font-medium text-slate-500">
                      {data.response.respondentEmail || "No email provided"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Submitted</p>
                <p className="text-sm font-semibold text-slate-800" suppressHydrationWarning>
                  {format(new Date(data.response.submittedAt), "PPpp")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 ring-1 ring-slate-900/5 shadow-md rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 px-6 pt-5">
              <CardTitle className="text-lg font-bold text-slate-900">Detailed Answers</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                Each question and its recorded response.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-1/3 px-6">Question</TableHead>
                    <TableHead className="px-6">Answer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formattedItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="align-top px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{item.label}</p>
                          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {item.type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top px-6 py-4">
                        <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 whitespace-pre-wrap w-full">
                          {item.formattedValue}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
