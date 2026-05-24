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
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Responses</p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{form.title}</h1>
                <p className="mt-1 text-sm text-slate-500">/f/{form.slug}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => router.push(`/dashboard/forms/${form.id}/analytics`)}
              >
                <LineChartIcon className="h-4 w-4" />
                View analytics
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`/f/${form.slug}`, "_blank")}
              >
                <EyeIcon className="h-4 w-4" />
                Open live form
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ClipboardListIcon className="h-5 w-5 text-primary" />
              Latest submissions
            </CardTitle>
            <CardDescription>
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
                  <Button onClick={() => window.open(`/f/${form.slug}`, "_blank")}>
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
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {response.respondentName || "Anonymous"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {response.respondentEmail || "No email provided"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {format(new Date(response.submittedAt), "PPpp")}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {response.itemCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            router.push(`/dashboard/forms/${formId}/responses/${response.id}`)
                          }
                        >
                          View details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
