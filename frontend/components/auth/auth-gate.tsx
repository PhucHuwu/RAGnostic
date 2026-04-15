"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/types";

type AuthGateProps = {
  roles?: UserRole[];
  children: ReactNode;
};

export function AuthGate({ roles, children }: AuthGateProps) {
  const router = useRouter();
  const { isReady, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (roles && user && !roles.includes(user.role)) {
      router.replace("/403");
    }
  }, [isAuthenticated, isReady, roles, router, user]);

  if (!isReady || !isAuthenticated) {
    return <main className="center-screen">Loading session...</main>;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <main className="center-screen">Redirecting...</main>;
  }

  return <>{children}</>;
}
