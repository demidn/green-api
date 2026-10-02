interface AvatarProps {
  alt: string;
  size?: "small" | "large";
}

export function Avatar({ alt, size = "large" }: AvatarProps) {
  const initials = alt
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      role="img"
      aria-label={alt}
      className={`flex shrink-0 items-center justify-center ${size === "large" ? "size-avatar" : "size-10"}`}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-linear-to-b from-avatar-start to-avatar-end font-medium text-primary ${size === "large" ? "size-14 text-2xl" : "size-10 text-message"}`}
      >
        {initials || "?"}
      </span>
    </span>
  );
}
