import type { ReactNode } from "react";
import { Button } from "@/components/common/button";

type StateBlockProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export function LoadingState({ title = "Loading..." }: { title?: string }) {
  return (
    <section className="state-block glass-panel" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{title}</p>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  children
}: StateBlockProps) {
  return (
    <section className="state-block glass-panel">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {children}
      {actionLabel && onAction ? (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}

export function ErrorState({ title, description, actionLabel, onAction }: StateBlockProps) {
  return (
    <section className="state-block glass-panel state-error" role="alert">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="danger" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
