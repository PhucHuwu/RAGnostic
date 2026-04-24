"use client";

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  Briefcase,
  FileText,
  LogOut,
  Menu,
  Settings,
  UserCircle2,
} from "lucide-react";
import { logout } from "@/lib/api";
import { clearAuthSession, getCurrentUser } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface UserLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: (path: string) => boolean;
}

const PROFILE_DETAIL_PATTERN = /^\/app\/profiles\/[^/]+(?:\/(chat|documents))?$/;

const USER_NAV_ITEMS: NavigationItem[] = [
  {
    href: "/app/profiles",
    icon: <Briefcase className="w-5 h-5" />,
    label: "Trợ lý AI của tôi",
    isActive: (path) =>
      path === "/app/profiles" || PROFILE_DETAIL_PATTERN.test(path),
  },
  {
    href: "/app/profiles/new",
    icon: <FileText className="w-5 h-5" />,
    label: "Tạo trợ lý mới",
    isActive: (path) => path === "/app/profiles/new",
  },
];

function getPageTitle(pathname: string) {
  if (pathname === "/app/profiles") {
    return "Trợ lý AI";
  }
  if (pathname === "/app/profiles/new") {
    return "Tạo trợ lý";
  }
  if (pathname.endsWith("/documents")) {
    return "Kho tri thức";
  }
  if (pathname.endsWith("/chat")) {
    return "Hội thoại";
  }
  if (PROFILE_DETAIL_PATTERN.test(pathname)) {
    return "Thiết lập trợ lý";
  }
  return "Không gian làm việc";
}

const UserLayout = ({ children }: UserLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const currentUser = getCurrentUser();

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const userInitial = useMemo(
    () => currentUser?.username?.charAt(0).toUpperCase() || "U",
    [currentUser?.username],
  );

  const closeMobileNav = () => setIsMobileNavOpen(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
    } finally {
      closeMobileNav();
      clearAuthSession();
      router.push("/login");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-border hover:bg-muted/40 transition-colors"
              aria-label="Mở điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/app/profiles" className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-ai flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-display font-bold truncate">RAGnostic</p>
                <p className="text-xs text-muted-foreground hidden sm:block truncate">
                  {pageTitle}
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{userInitial}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-4">{currentUser?.username ?? "Người dùng"}</p>
              <p className="text-xs text-muted-foreground">Người dùng</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] lg:flex">
        <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] border-r border-border bg-sidebar/40">
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Không gian làm việc
            </p>
            <nav className="space-y-1">
              {USER_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={item.isActive(pathname)}
                />
              ))}
            </nav>
          </div>

          <div className="mt-auto p-5 border-t border-border space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors">
              <Settings className="w-5 h-5" />
              <span>Thiết lập</span>
            </button>
            <button
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </button>
          </div>
        </aside>

        <main className="min-h-[calc(100vh-64px)] flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm p-0 flex flex-col h-full">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-primary" />
              Điều hướng người dùng
            </SheetTitle>
          </SheetHeader>

          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Không gian làm việc
            </p>
            <nav className="space-y-1">
              {USER_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={item.isActive(pathname)}
                  onNavigate={closeMobileNav}
                />
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-border p-5 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors">
              <UserCircle2 className="w-5 h-5" />
              <span>{currentUser?.username ?? "Người dùng"}</span>
            </button>
            <button
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}

const NavLink = ({ href, icon, label, active, onNavigate }: NavLinkProps) => (
  <Link
    href={href}
    onClick={onNavigate}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground"
        : "text-sidebar-foreground hover:bg-sidebar-accent/20"
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

export default UserLayout;
