"use client";

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  Users,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  Menu,
  Shield,
} from "lucide-react";
import { clearAuthSession, getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const ADMIN_NAV_ITEMS: NavigationItem[] = [
  {
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
    label: "Tài khoản người dùng",
  },
  {
    href: "/admin/documents",
    icon: <FileText className="w-5 h-5" />,
    label: "Kho tri thức hệ thống",
  },
  {
    href: "/admin/model",
    icon: <Settings className="w-5 h-5" />,
    label: "Mô hình AI mặc định",
  },
  {
    href: "/admin/logs",
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Giám sát hoạt động",
  },
];

function getAdminPageTitle(pathname: string) {
  if (pathname === "/admin/users") {
    return "Tài khoản người dùng";
  }
  if (pathname === "/admin/documents") {
    return "Kho tri thức hệ thống";
  }
  if (pathname === "/admin/model") {
    return "Mô hình AI mặc định";
  }
  if (pathname === "/admin/logs") {
    return "Giám sát hoạt động";
  }
  return "Điều hành hệ thống";
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const currentUser = getCurrentUser();

  const pageTitle = useMemo(() => getAdminPageTitle(pathname), [pathname]);
  const adminInitial = useMemo(
    () => currentUser?.username?.charAt(0).toUpperCase() || "A",
    [currentUser?.username],
  );

  const isActive = (path: string) => pathname.startsWith(path);
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
              aria-label="Mở điều hướng admin"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin/users" className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-ai flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-display font-bold truncate">RAGnostic Admin</p>
                <p className="text-xs text-muted-foreground hidden sm:block truncate">
                  {pageTitle}
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-accent">{adminInitial}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-4">{currentUser?.username ?? "Admin"}</p>
              <p className="text-xs text-muted-foreground">Quản trị viên</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] lg:flex">
        <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] border-r border-border bg-sidebar/40">
          <div className="p-5">
            <div className="mb-4 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                Không gian quản trị
              </p>
            </div>
            <nav className="space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
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
              <Shield className="w-5 h-5 text-accent" />
              Điều hướng quản trị
            </SheetTitle>
          </SheetHeader>

          <div className="px-5 py-4">
            <div className="mb-4 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                Không gian quản trị
              </p>
            </div>
            <nav className="space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  onNavigate={closeMobileNav}
                />
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-border p-5 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors">
              <Shield className="w-5 h-5" />
              <span>{currentUser?.username ?? "Admin"}</span>
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

export default AdminLayout;
