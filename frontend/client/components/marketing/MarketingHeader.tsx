"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain } from "lucide-react";
import { logout } from "@/lib/api";
import { clearAuthSession, getCurrentUser, type AuthUser } from "@/lib/auth";

interface MarketingHeaderProps {
  fixed?: boolean;
}

export default function MarketingHeader({ fixed = false }: MarketingHeaderProps) {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setSessionUser(getCurrentUser());
  }, []);

  const primaryHref =
    sessionUser?.role === "ADMIN" ? "/admin/users" : "/app/profiles/new";

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Ignore API failure and clear local session anyway.
    } finally {
      clearAuthSession();
      setSessionUser(null);
      setIsLoggingOut(false);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header
      className={
        fixed
          ? "fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
          : "sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-ai flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold font-display">RAGnostic</span>
        </Link>
        <div className="flex gap-4">
          {!sessionUser ? (
            <Link
              href="/login"
              className="px-6 py-2 rounded-lg font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Đăng nhập
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-6 py-2 rounded-lg font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          )}
          <Link
            href={sessionUser ? primaryHref : "/login"}
            className="px-6 py-2 rounded-lg font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            {sessionUser ? "Vào ứng dụng" : "Bắt đầu"}
          </Link>
        </div>
      </div>
    </header>
  );
}
