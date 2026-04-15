import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, id, ...rest }: InputProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="field" htmlFor={fieldId}>
      <span className="field-label">{label}</span>
      <input
        id={fieldId}
        className={cx("field-input", error && "field-error", className)}
        {...rest}
      />
      {error ? <span className="field-message">{error}</span> : null}
    </label>
  );
}
