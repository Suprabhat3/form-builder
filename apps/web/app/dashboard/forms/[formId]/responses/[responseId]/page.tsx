"use client";

import { use, useMemo } from "react";
import { format } from "date-fns";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { ArrowLeftIcon, ClipboardListIcon } from "lucide-react";
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
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                onClick={() => router.push(`/dashboard/forms/${formId}/responses`)}
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Response detail</p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{form.title}</h1>
                <p className="mt-1 text-sm text-slate-500">/f/{form.slug}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <ClipboardListIcon className="h-5 w-5 text-primary" />
                Submission
              </CardTitle>
              <CardDescription>
                Captured details about this respondent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Respondent</p>
                <p className="text-base font-semibold text-slate-900">{respondentLabel}</p>
                <p className="text-xs text-slate-500">
                  {data.response.respondentEmail || "No email provided"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Submitted</p>
                <p className="text-sm font-medium text-slate-800">
                  {format(new Date(data.response.submittedAt), "PPpp")}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/dashboard/forms/${formId}/analytics`)}
              >
                View analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Answers</CardTitle>
              <CardDescription>
                Each question and its recorded response.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formattedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.type.replace(/_/g, " ")}</p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap text-slate-700">
                        {item.formattedValue}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
