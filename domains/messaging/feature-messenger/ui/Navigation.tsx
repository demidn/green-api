"use client";

import { Icon, type IconName } from "@/shared/ui/Icon";
import { useSetAtom } from "jotai";
import { settingsOpenAtom } from "../store/ui.atoms";

const items: { label: string; icon: IconName }[] = [
  { label: "Чаты", icon: "chat" },
  { label: "Настройки", icon: "settings" },
];

function NavigationItem({
  label,
  icon,
  active = false,
  settings = false,
}: {
  label: string;
  icon: IconName;
  active?: boolean;
  settings?: boolean;
}) {
  const setSettingsOpen = useSetAtom(settingsOpenAtom);
  const content = (
    <>
      <Icon name={icon} />
      <span>{label}</span>
    </>
  );
  const className = `flex flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2 text-caption ${active ? "text-accent" : "text-muted"}`;
  return settings ? (
    <button type="button" onClick={() => setSettingsOpen(true)} className={className}>
      {content}
    </button>
  ) : (
    <span aria-current={active ? "page" : undefined} className={className}>
      {content}
    </span>
  );
}

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <nav
        aria-label="Mobile navigation preview"
        className="flex gap-2 border-t border-divider bg-surface px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5"
      >
        {items.map((item) => (
          <NavigationItem
            key={item.label}
            {...item}
            active={item.icon === "chat"}
            settings={item.icon === "settings"}
          />
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Navigation preview" className="flex h-full flex-col px-1 py-4">
      <div className="space-y-2">
        <NavigationItem label="Все чаты" icon="chat" active />
      </div>
      <div className="mx-2 my-3 border-t border-divider" />
      <div className="flex-1" />
      <div>
        <NavigationItem label="Настройки" icon="settings" settings />
      </div>
    </nav>
  );
}
