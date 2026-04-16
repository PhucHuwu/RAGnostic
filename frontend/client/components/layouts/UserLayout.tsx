import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brain, Briefcase, FileText, LogOut, Settings, Home } from "lucide-react";

interface UserLayoutProps {
  children: ReactNode;
}

const UserLayout = ({ children }: UserLayoutProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-lg bg-gradient-ai flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-display font-bold text-sidebar-foreground">
            RAGnostic
          </span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavLink
            to="/app/profiles"
            icon={<Briefcase className="w-5 h-5" />}
            label="Profiles"
            active={isActive("/app/profiles")}
          />
          <NavLink
            to="/app/profiles/new"
            icon={<FileText className="w-5 h-5" />}
            label="Tạo Profile"
            active={isActive("/app/profiles/new")}
          />
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Settings className="w-5 h-5" />
            <span>Cài đặt</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Topbar */}
        <header className="sticky top-0 bg-card/50 backdrop-blur-md border-b border-border h-16 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold text-foreground">
              Khu vực Người dùng
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">U</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-64px)] p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
  active: boolean;
}

const NavLink = ({ to, icon, label, active }: NavLinkProps) => (
  <Link
    to={to}
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

export default UserLayout;
