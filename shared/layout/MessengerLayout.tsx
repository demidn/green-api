import type { ReactNode } from "react";

interface MessengerLayoutProps {
  navigation: ReactNode;
  sidebar: ReactNode;
  content: ReactNode;
  mobileNavigation: ReactNode;
}

export function MessengerLayout({
  navigation,
  sidebar,
  content,
  mobileNavigation,
}: MessengerLayoutProps) {
  return (
    <div className="grid h-dvh w-full overflow-hidden bg-surface desktop:grid-cols-[var(--spacing-rail)_var(--spacing-sidebar)_minmax(0,1fr)]">
      <div className="hidden min-h-0 border-r border-divider desktop:block">{navigation}</div>
      <aside
        aria-label="Боковая панель"
        className="messenger-sidebar flex min-h-0 min-w-0 flex-col border-r border-divider desktop:flex"
      >
        <div className="flex min-h-0 flex-1 flex-col">{sidebar}</div>
        <div className="shrink-0 desktop:hidden">{mobileNavigation}</div>
      </aside>
      <main
        aria-label="Основная область"
        className="messenger-content flex min-h-0 min-w-0 flex-col desktop:flex"
      >
        {content}
      </main>
    </div>
  );
}
