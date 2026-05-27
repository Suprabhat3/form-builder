"use client";

import { use } from "react";
import { useState } from "react";
import { format } from "date-fns";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { ArrowLeftIcon, ClipboardListIcon, EyeIcon, LineChartIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  return (
    <RequireAuth>
      <ResponsesContent params={params} />
    </RequireAuth>
  );
}

function ResponsesContent({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isApplying, setIsApplying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: form, isLoading: formLoading } = trpc.form.getById.useQuery({ formId });
  const {
    data: responses,
    isLoading: responsesLoading,
    isFetching: responsesFetching,
    refetch,
  } = trpc.form.getResponses.useQuery({
    formId,
    search: search || undefined,
    fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
    toDate: toDate ? new Date(toDate).toISOString() : undefined,
    page,
    pageSize,
  });
  const exportCsv = trpc.form.exportResponsesCsv.useQuery(
    {
      formId,
      search: search || undefined,
      fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
      toDate: toDate ? new Date(toDate).toISOString() : undefined,
    },
    { enabled: false },
  );

  const total = responses?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const hasFilters = Boolean(search || fromDate || toDate);

  if (formLoading || responsesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading responses...
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Form not found.
      </div>
    );
  }

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
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Form Responses</p>
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
              onClick={() => router.push(`/dashboard/forms/${form.id}/analytics`)}
            >
              <LineChartIcon className="h-4 w-4 text-slate-500" />
              View Analytics
            </Button>
            <Button
              variant="default"
              className="h-9 gap-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md font-semibold bg-slate-900 hover:bg-slate-800 text-white"
              onClick={() => window.open(`/f/${form.slug}`, "_blank")}
            >
              <EyeIcon className="h-4 w-4" />
              Open Live Form
            </Button>
          </div>
        </div>

        <Card className="border-0 ring-1 ring-slate-900/5 shadow-md rounded-2xl bg-white overflow-hidden">
          <CardHeader className="gap-1.5 border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100/60">
                <ClipboardListIcon className="size-5 text-emerald-600" />
              </div>
              Latest Submissions
            </CardTitle>
            <CardDescription className="pl-11 text-sm font-medium text-slate-500">
              Review every response submitted to this form.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 py-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="response-search" className="text-xs font-semibold text-slate-600">
                    Search
                  </Label>
                  <Input
                    id="response-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, email, or answer..."
                    className="h-10 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response-from" className="text-xs font-semibold text-slate-600">
                    From
                  </Label>
                  <Input
                    id="response-from"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response-to" className="text-xs font-semibold text-slate-600">
                    To
                  </Label>
                  <Input
                    id="response-to"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 bg-white"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4">
                <Button
                  variant="outline"
                  className="h-9 px-4 font-semibold"
                  onClick={() => {
                    setIsApplying(true);
                    setPage(1);
                    refetch().finally(() => setIsApplying(false));
                  }}
                  disabled={responsesFetching || isApplying}
                >
                  {isApplying ? "Applying..." : "Apply filters"}
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 px-4 font-semibold text-slate-600"
                  onClick={() => {
                    setSearch("");
                    setFromDate("");
                    setToDate("");
                    setPage(1);
                  }}
                  disabled={!hasFilters || responsesFetching}
                >
                  Reset
                </Button>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-9 gap-2 px-4 font-semibold"
                    onClick={async () => {
                      try {
                        setIsExporting(true);
                        const data = await exportCsv.refetch();
                        if (!data.data) return;
                        const blob = new Blob([data.data.csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = data.data.filename;
                        a.click();
                        URL.revokeObjectURL(url);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    disabled={isExporting}
                  >
                    {isExporting ? "Exporting..." : "Export CSV"}
                  </Button>
                </div>
              </div>
            </div>

            {!responses || responses.items.length === 0 ? (
              <Empty className="rounded-xl border border-dashed border-slate-200 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ClipboardListIcon className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No responses yet</EmptyTitle>
                  <EmptyDescription>
                    Publish your form and share the link to start collecting responses.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button className="transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => window.open(`/f/${form.slug}`, "_blank")}>
                    Open live form
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Respondent
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Submitted
                      </TableHead>
                      <TableHead className="h-11 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Answers
                      </TableHead>
                      <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Latest inputs
                      </TableHead>
                      <TableHead className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.items.map((response) => (
                      <TableRow key={response.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200/50">
                              {(response.respondentName?.[0] || response.respondentEmail?.[0] || "A").toUpperCase()}
                            </div>
                            <div className="min-w-0 flex flex-col gap-0.5">
                              <span className="truncate text-sm font-semibold text-slate-900">
                                {response.respondentName || "Anonymous"}
                              </span>
                              <span className="truncate text-xs font-medium text-slate-500">
                                {response.respondentEmail || "No email provided"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-middle text-sm font-medium text-slate-600" suppressHydrationWarning>
                          {format(new Date(response.submittedAt), "PPpp")}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center align-middle">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {response.itemCount}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-md px-4 py-4 align-middle whitespace-normal">
                          <div className="flex flex-wrap gap-1.5">
                            {response.answers.slice(0, 3).map((answer) => (
                              <div key={`${response.id}-${answer.fieldId}`} className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px]">
                                <span className="max-w-[100px] truncate font-semibold text-slate-700">{answer.label}:</span>
                                <span className="max-w-[140px] truncate text-slate-600">{formatValue(answer.value)}</span>
                              </div>
                            ))}
                            {response.answers.length === 0 && (
                              <span className="text-xs italic text-slate-400">No captured answers</span>
                            )}
                            {response.answers.length > 3 && (
                              <div className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                                +{response.answers.length - 3}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right align-middle">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full px-4 text-xs font-semibold shadow-sm"
                            onClick={() =>
                              router.push(`/dashboard/forms/${formId}/responses/${response.id}`)
                            }
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {responses && responses.items.length > 0 && (
            <CardFooter className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-500">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="rows-per-page" className="text-xs font-semibold text-slate-500">
                    Rows
                  </Label>
                  <select
                    id="rows-per-page"
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-xs"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 px-4" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Prev
                  </Button>
                  <span className="min-w-[88px] text-center text-sm font-medium text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" className="h-9 px-4" disabled={!canNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
