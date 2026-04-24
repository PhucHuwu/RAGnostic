"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, type AppRole } from "@/lib/auth";

type GuardMode = "protected" | "public-only";

interface ClientRouteGuardProps {
  children: ReactNode;
  mode: GuardMode;
  requiredRole?: AppRole;
}

const ClientRouteGuard = ({
  children,
  mode,
  requiredRole,
}: ClientRouteGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "allowed" | "redirecting">(
    "checking",
  );

  useEffect(() => {
    const sessionUser = getCurrentUser();

    if (mode === "public-only") {
      if (!sessionUser) {
        setStatus("allowed");
        return;
      }

      setStatus("redirecting");
      router.replace(sessionUser.role === "ADMIN" ? "/admin/users" : "/app/profiles");
      return;
    }

    if (!sessionUser) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      setStatus("redirecting");
      router.replace(`/login${next}`);
      return;
    }

    if (requiredRole && sessionUser.role !== requiredRole) {
      setStatus("redirecting");
      router.replace("/403");
      return;
    }

    setStatus("allowed");
  }, [mode, pathname, requiredRole, router]);

  if (status !== "allowed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Đang điều hướng...
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ClientRouteGuard;
