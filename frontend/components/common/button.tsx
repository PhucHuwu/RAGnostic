import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: ReactNode;
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  danger: "btn btn-danger"
};

export function Button({
  className,
  variant = "primary",
  isLoading = false,
  icon,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(variantClassMap[variant], className)}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? <span className="spinner" aria-hidden="true" /> : icon}
      <span>{children}</span>
    </button>
  );
}
