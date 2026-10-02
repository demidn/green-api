import { useId, type ComponentPropsWithRef } from "react";

interface TextBoxProps extends ComponentPropsWithRef<"input"> {
  label: string;
  error?: string;
}

export function TextBox({
  label,
  error,
  id,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: TextBoxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-label text-secondary">
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={
          [describedBy, error ? errorId : undefined].filter(Boolean).join(" ") || undefined
        }
        className={`w-full rounded-control border border-divider bg-surface-secondary px-3 py-3 text-detail text-primary placeholder:text-muted disabled:opacity-50 ${className}`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-meta text-secondary">
          {error}
        </p>
      )}
    </div>
  );
}
