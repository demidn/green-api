import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: IconName;
  size?: "small" | "medium";
}

export function IconButton({
  label,
  icon,
  size = "medium",
  className = "text-secondary",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center rounded-control enabled:hover:bg-hover disabled:cursor-default ${size === "small" ? "size-8" : "size-10"} ${className}`}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
