"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/common/button";
import { useAuth } from "@/components/providers/auth-provider";
import { cx } from "@/lib/utils";

const userLinks = [
  { href: "/profiles", label: "Profiles" },
  { href: "/documents", label: "Documents" },
  { href: "/chat", label: "Chat" }
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="top-nav glass-panel">
      <Link href="/" className="brand">
        RAGnostic
      </Link>
      <nav aria-label="Main" className="top-nav-links">
        {userLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cx("nav-link", pathname.startsWith(link.href) && "nav-link-active")}
          >
            {link.label}
          </Link>
        ))}
        {user?.role === "ADMIN" ? (
          <Link
            href="/admin"
            className={cx("nav-link", pathname.startsWith("/admin") && "nav-link-active")}
          >
            Admin
          </Link>
        ) : null}
      </nav>
      <div className="top-nav-side">
        {isAuthenticated ? (
          <>
            <span className="user-pill">{user?.username}</span>
            <Button
              variant="ghost"
              onClick={async () => {
                await logout();
                router.push("/auth/login");
              }}
            >
              Logout
            </Button>
          </>
        ) : (
          <Link href="/auth/login" className="btn btn-primary">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
