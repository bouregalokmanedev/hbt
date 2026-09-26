"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";
import { RAIL_TOP, RAIL_LEARN, RAIL_FOOT, type RailItem } from "@/lib/navigation";
import { MODS } from "@/data/shared/modules";

function useActive() {
  const pathname = usePathname();
  return (href: string) => {
    // strip locale prefix
    const path = pathname.replace(/^\/[a-z]{2}/, "");
    if (href === "/hub") return path === "/hub" || path === "";
    return path.startsWith(href);
  };
}

export function RailNav() {
  const t = useTranslations("shell.rail");
  const locale = useLocale();
  const isActive = useActive();
  const expanded = useAppStore((s) => s.settings.railExpanded);
  const api = useAppStoreApi();

  const width = expanded ? 206 : 66;

  return (
    <nav
      aria-label={t("hub")}
      className="flex h-full shrink-0 flex-col border-e border-black/40 bg-shell-surface py-3 transition-[width] duration-150 ease-smooth"
      style={{ width }}
    >
      <RailSection>
        {RAIL_TOP.map((item) => (
          <RailLink key={item.id} item={item} label={t(item.labelKey)} active={isActive(item.href)} expanded={expanded} locale={locale} />
        ))}
      </RailSection>

      <RailLabel expanded={expanded}>{t("simulators")}</RailLabel>
      <RailSection>
        {MODS.map((m) => (
          <RailLink
            key={m.id}
            item={{ id: m.id, icon: m.id, href: `/tools/${m.id}`, labelKey: m.id }}
            label={m.name}
            badge={`${m.progress}%`}
            active={isActive(`/tools/${m.id}`)}
            expanded={expanded}
            locale={locale}
          />
        ))}
      </RailSection>

      <RailLabel expanded={expanded}>{t("learningRecord")}</RailLabel>
      <RailSection>
        {RAIL_LEARN.map((item) => (
          <RailLink key={item.id} item={item} label={t(item.labelKey)} active={isActive(item.href)} expanded={expanded} locale={locale} />
        ))}
      </RailSection>

      <div className="mt-auto flex flex-col gap-1">
        {RAIL_FOOT.map((item) => (
          <RailLink key={item.id} item={item} label={t(item.labelKey)} active={isActive(item.href)} expanded={expanded} locale={locale} />
        ))}
        <button
          type="button"
          onClick={() => api.getState().toggleRail()}
          aria-label={expanded ? t("collapse") : t("expand")}
          className="focus-ring mx-2 mt-1 flex h-8 items-center justify-center rounded-md text-shell-dim hover:bg-white/5"
        >
          <span aria-hidden className="rtl:-scale-x-100">
            {expanded ? "«" : "»"}
          </span>
        </button>
      </div>
    </nav>
  );
}

function RailSection({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1 px-2">{children}</div>;
}

function RailLabel({ children, expanded }: { children: React.ReactNode; expanded: boolean }) {
  if (!expanded) return <div className="my-2 h-px bg-white/5" />;
  return <div className="t-eyebrow mt-4 mb-1 px-4 text-shell-muted">{children}</div>;
}

function RailLink({
  item,
  label,
  badge,
  active,
  expanded,
  locale,
}: {
  item: RailItem;
  label: string;
  badge?: string;
  active: boolean;
  expanded: boolean;
  locale: string;
}) {
  return (
    <Link
      href={`/${locale}${item.href}`}
      title={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring relative flex h-[38px] items-center gap-3 rounded-md px-3 transition-colors duration-150",
        active ? "bg-[rgba(244,120,34,0.14)] font-semibold text-white" : "font-medium text-shell-dim hover:bg-white/5",
      )}
    >
      {active ? <span aria-hidden className="absolute inset-y-1.5 start-0 w-[3px] rounded-pill bg-brand" /> : null}
      <Icon name={item.icon} size={20} className="shrink-0" />
      {expanded ? (
        <>
          <span className="t-rail flex-1 truncate">{label}</span>
          {badge ? (
            <span dir="ltr" className="t-mono text-[10px] text-shell-dim2">
              {badge}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}
