"use client";

import { use } from "react";
import { format } from "date-fns";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
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

  const { data: form, isLoading: formLoading } = trpc.form.getById.useQuery({ formId });
  const { data: responses, isLoading: responsesLoading } = trpc.form.getResponses.useQuery({ formId });

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
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 px-6 pt-5">
            <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <div className="p-1.5 rounded-lg bg-emerald-100/50">
                <ClipboardListIcon className="h-5 w-5 text-emerald-600" />
              </div>
              Latest Submissions
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500">
              Review every response submitted to this form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!responses || responses.length === 0 ? (
              <Empty className="border-slate-200">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ClipboardListIcon className="h-5 w-5" />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Answers</TableHead>
                    <TableHead>Latest inputs</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 font-bold text-xs ring-1 ring-indigo-200/50">
                            {(response.respondentName?.[0] || response.respondentEmail?.[0] || "A").toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm">
                              {response.respondentName || "Anonymous"}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {response.respondentEmail || "No email provided"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs font-medium" suppressHydrationWarning>
                        {format(new Date(response.submittedAt), "PPpp")}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full text-xs">
                          {response.itemCount}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="flex flex-wrap gap-1.5">
                          {response.answers.slice(0, 3).map((answer) => (
                            <div key={`${response.id}-${answer.fieldId}`} className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-[11px]">
                              <span className="font-semibold text-slate-700 truncate max-w-[100px]">{answer.label}:</span>
                              <span className="text-slate-600 truncate max-w-[120px]">{formatValue(answer.value)}</span>
                            </div>
                          ))}
                          {response.answers.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No captured answers</span>
                          )}
                          {response.answers.length > 3 && (
                            <div className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                              +{response.answers.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full px-4 gap-1.5 transition-all cursor-pointer bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold border-slate-200 text-xs"
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
            )}
          </CardContent>
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
