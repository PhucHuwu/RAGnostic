import type { ReactNode } from "react";

type DrawerProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Drawer({ title, children, footer }: DrawerProps) {
  return (
    <aside className="drawer glass-panel" aria-label={title}>
      <header className="drawer-header">
        <h3>{title}</h3>
      </header>
      <div className="drawer-body">{children}</div>
      {footer ? <footer className="drawer-footer">{footer}</footer> : null}
    </aside>
  );
}
