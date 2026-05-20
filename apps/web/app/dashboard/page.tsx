import { RequireAuth } from "~/components/auth/RequireAuth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-3 text-on-surface-variant">
          You are authenticated. Form builder features will be mounted here next.
        </p>
      </main>
    </RequireAuth>
  );
}
