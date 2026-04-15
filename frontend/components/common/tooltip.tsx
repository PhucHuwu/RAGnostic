import type { ReactNode } from "react";

type TooltipProps = {
  label: string;
  children: ReactNode;
};

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="tooltip-wrap">
      {children}
      <span className="tooltip-bubble" role="tooltip">
        {label}
      </span>
    </span>
  );
}
