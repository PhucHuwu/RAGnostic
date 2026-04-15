import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
};

const badgeClassMap: Record<BadgeVariant, string> = {
  neutral: "badge badge-neutral",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  info: "badge badge-info"
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return <span className={cx(badgeClassMap[variant])}>{children}</span>;
}
