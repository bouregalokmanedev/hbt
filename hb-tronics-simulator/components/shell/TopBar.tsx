"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { ComponentContextBar } from "./ComponentContextBar";
import { UserMenu } from "./UserMenu";
import { useChrome } from "@/lib/useBreakpoint";
import { MODS } from "@/data/shared/modules";

interface SectionInfo {
  icon: string;
  titleKey: string;
  ns: string;
  moduleIndex?: number;
}

const SECTIONS: Record<string, SectionInfo> = {
  hub: { icon: "hub", titleKey: "title", ns: "hub" },
  garage: { icon: "garage", titleKey: "title", ns: "garage" },
  progress: { icon: "progress", titleKey: "title", ns: "progress" },
  reports: { icon: "reports", titleKey: "title", ns: "reports" },
  settings: { icon: "settings", titleKey: "title", ns: "settings" },
};

export function TopBar() {
  const pathname = usePathname();
  const path = pathname.replace(/^\/[a-z]{2}/, "");
  const { showModuleKicker } = useChrome();

  const toolMatch = path.match(/^\/tools\/(\w+)/);
  const sectionKey = toolMatch ? null : path.split("/")[1] || "hub";

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-black/40 bg-shell-card px-5">
      {toolMatch ? <ToolHeader toolId={toolMatch[1]} showKicker={showModuleKicker} /> : <SectionHeader sectionKey={sectionKey!} />}
      <div className="flex items-center gap-4">
        <ComponentContextBar />
        <UserMenu />
      </div>
    </header>
  );
}

function SectionHeader({ sectionKey }: { sectionKey: string }) {
  const info = SECTIONS[sectionKey] ?? SECTIONS.hub;
  const t = useTranslations(info.ns);
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-brand">
        <Icon name={info.icon} size={20} />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="t-eyebrow text-shell-dim">HB TRONICS SAAS SIMULATOR</span>
        <span className="t-body font-semibold text-shell-textHi">{t(info.titleKey)}</span>
      </div>
    </div>
  );
}

function ToolHeader({ toolId, showKicker }: { toolId: string; showKicker: boolean }) {
  const mod = MODS.find((m) => m.id === toolId);
  const tShell = useTranslations("shell.module");
  if (!mod) return null;
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: mod.accentBg, color: mod.accent }}
      >
        <Icon name={mod.id} size={20} />
      </span>
      <div className="flex flex-col leading-tight">
        {showKicker ? (
          <span className="t-eyebrow text-shell-dim">{tShell("kicker", { index: mod.index, title: mod.name.toUpperCase() })}</span>
        ) : null}
        <span className="t-body font-semibold text-shell-textHi">{mod.title}</span>
      </div>
    </div>
  );
}
