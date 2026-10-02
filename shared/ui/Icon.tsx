import type { ReactNode } from "react";

const paths = {
  back: <path d="m10 5-7 7 7 7M3 12h18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chat: <path d="M21 11.5a9 9 0 0 1-9 9 11 11 0 0 1-4-.8L3 21l1.3-5a9 9 0 1 1 16.7-4.5Z" />,
  phone: (
    <path d="m7 3 3 5-3 2c1.4 3 3 4.6 6 6l2-3 5 3c.5.3.6.8.4 1.4L19 21C10 21 3 14 3 5l2.6-2.4C6 2.3 6.6 2.5 7 3Z" />
  ),
  contacts: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 6" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-.6 2.5-2 .9L4 6l-2 3 1.8 1.8v2.4L2 15l2 3 2.4-.4 2 .9L9 21h6l.6-2.5 2-.9L20 18l2-3-1.8-1.8v-2.4L22 9l-2-3-2.4.4-2-.9L15 3Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  folder: <path d="M3 7V5h6l2 2h10v13H3Z" />,
  attach: (
    <path d="m8 12 7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3m-7 13 9-9a1.5 1.5 0 0 1 2 2l-9 9" />
  ),
  send: <path d="m4 11 17-8-8 18-2-8-7-2Zm7 2L21 3" />,
  read: <path d="m2 12 4 4 9-9m-4 8 2 2 9-9" />,
  sent: <path d="m4 12 5 5L20 6" />,
  pending: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6m0 3h.01" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-6" }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {paths[name]}
    </svg>
  );
}
