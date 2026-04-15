import type { SelectHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
  error?: string;
};

export function Select({ label, options, error, className, id, ...rest }: SelectProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="field" htmlFor={fieldId}>
      <span className="field-label">{label}</span>
      <select
        id={fieldId}
        className={cx("field-input", error && "field-error", className)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="field-message">{error}</span> : null}
    </label>
  );
}
