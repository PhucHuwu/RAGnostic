import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, actions, children }: AppShellProps) {
  return (
    <>
      <TopNav />
      <main id="main-content" className="app-main">
        <header className="page-header glass-panel">
          <div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="page-header-actions">{actions}</div> : null}
        </header>
        {children}
      </main>
    </>
  );
}
