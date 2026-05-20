"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser } from "~/lib/auth-session";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = getAuthUser();
    if (user) return;

    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [pathname, router]);

  if (!getAuthUser()) return null;
  return <>{children}</>;
}
