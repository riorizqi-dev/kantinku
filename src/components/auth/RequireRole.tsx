"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type { UserRole } from "@/lib/types";
import { dashboardPath } from "@/lib/roles";

type Props = {
  allow: UserRole[];
  children: React.ReactNode;
  /** Redirect jika role tidak cocok (default: login) */
  fallback?: string;
};

/**
 * Proteksi route berdasarkan role.
 * Seller tidak boleh ke dashboard customer, dan sebaliknya.
 */
export function RequireRole({ allow, children, fallback }: Props) {
  const { ready, state } = useApp();
  const router = useRouter();
  const session = state.session;

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace(fallback || "/login");
      return;
    }
    if (!allow.includes(session.role)) {
      const home = dashboardPath(session.role) || "/";
      router.replace(home);
    }
  }, [ready, session, allow, fallback, router]);

  if (!ready || !session || !allow.includes(session.role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-stone-100 dark:bg-[#0a0a0b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-kantin-200 border-t-kantin-600 dark:border-kantin-900 dark:border-t-kantin-500" />
      </div>
    );
  }

  return <>{children}</>;
}
