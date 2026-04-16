"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  Users,
  FileText,
  Settings,
  LogOut,
  BarChart3,
} from "lucide-react";
import { clearAuthSession } from "@/lib/auth";
import { logout } from "@/lib/api";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
    } finally {
      clearAuthSession();
      router.push("/login");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-lg bg-gradient-ai flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-display font-bold text-sidebar-foreground">
            RAGnostic
          </span>
        </Link>

        {/* Admin Badge */}
        <div className="mb-8 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-xs font-semibold text-accent uppercase tracking-wide">
            Admin Dashboard
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavLink
            href="/admin/users"
            icon={<Users className="w-5 h-5" />}
            label="Người dùng"
            active={isActive("/admin/users")}
          />
          <NavLink
            href="/admin/documents"
            icon={<FileText className="w-5 h-5" />}
            label="Tài liệu"
            active={isActive("/admin/documents")}
          />
          <NavLink
            href="/admin/model"
            icon={<Settings className="w-5 h-5" />}
            label="Cấu hình Model"
            active={isActive("/admin/model")}
          />
          <NavLink
            href="/admin/logs"
            icon={<BarChart3 className="w-5 h-5" />}
            label="Nhật ký"
            active={isActive("/admin/logs")}
          />
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Settings className="w-5 h-5" />
            <span>Cài đặt</span>
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Topbar */}
        <header className="sticky top-0 bg-card/50 backdrop-blur-md border-b border-border h-16 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-accent">A</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-64px)] p-8">{children}</main>
      </div>
    </div>
  );
};

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
}

const NavLink = ({ href, icon, label, active }: NavLinkProps) => (
  <Link
    href={href}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground"
        : "text-sidebar-foreground hover:bg-sidebar-accent"
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

export default AdminLayout;
