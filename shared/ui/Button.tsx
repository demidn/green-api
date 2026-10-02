import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={type}
      className={`rounded-control bg-accent px-4 py-3 text-detail font-medium text-primary hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}
