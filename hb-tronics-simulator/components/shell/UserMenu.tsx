"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";
import { useChrome } from "@/lib/useBreakpoint";

/** User menu (02/09 §2.5). Avatar + name/role (hidden < 1120), XP, sign-out. */
export function UserMenu() {
  const t = useTranslations("shell.user");
  const locale = useLocale();
  const router = useRouter();
  const api = useAppStoreApi();
  const open = useAppStore((s) => s.userMenuOpen);
  const { showUserText } = useChrome();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => api.getState().toggleUserMenu()}
        aria-expanded={open}
        aria-haspopup="menu"
        className="focus-ring flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/20"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-brand text-brand-on">
          <Icon name="user" size={18} />
        </span>
        {showUserText ? (
          <span className="flex flex-col items-start leading-tight">
            <span className="t-cta text-shell-textHi">{t("name")}</span>
            <span className="t-eyebrow text-shell-dim">{t("role")}</span>
          </span>
        ) : null}
        <span dir="ltr" className="t-mono text-[10px] text-brand">
          {t("xp", { xp: "4 820" })}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-40 mt-2 w-44 rounded-lg bg-shell-card p-1.5 shadow-menu"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              api.getState().signOut();
              router.push(`/${locale}/login`);
            }}
            className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 t-body-sm text-shell-text hover:bg-white/5"
          >
            {t("signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
