import { Reorder, useDragControls } from "framer-motion";
import { Columns2, EyeOff, GripVertical, Lock, RectangleHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  SECTION_CARDS,
  canHideCard,
  canResizeCard,
  type DashboardCardId,
  type DashboardCardWidth,
  type DashboardSectionId,
} from "../../layout/layout";

interface DashboardSectionSlotProps {
  id: DashboardSectionId;
  editing: boolean;
  children: ReactNode;
  onHide: (id: DashboardCardId) => void;
  /** Present when this section's single card can toggle half/full width. */
  width?: DashboardCardWidth;
  onToggleWidth?: (id: DashboardCardId) => void;
  /** Grid span classes for the 2-column dashboard row grid. */
  spanClassName?: string;
}

export function DashboardSectionSlot({
  id,
  editing,
  children,
  onHide,
  width = "full",
  onToggleWidth,
  spanClassName = "col-span-full",
}: DashboardSectionSlotProps) {
  const { t } = useTranslation();
  const controls = useDragControls();
  const cards = SECTION_CARDS[id];
  const hideableCards = cards.filter(canHideCard);
  const resizeCardId = cards.length === 1 && canResizeCard(cards[0]) ? cards[0] : null;
  const label = cards
    .map((card) => t(`dashboard.personalize.cards.${card}`))
    .join(" · ");

  const hideSection = () => {
    hideableCards.forEach((cardId) => onHide(cardId));
  };

  const toggleWidth = () => {
    if (resizeCardId && onToggleWidth) onToggleWidth(resizeCardId);
  };

  const isHalf = width === "half";

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      data-testid={`dashboard-section-${id}`}
      data-width={isHalf ? "half" : "full"}
      className={[
        "list-none",
        spanClassName,
        editing ? "hbt-wiggle rounded-2xl" : "",
      ].join(" ")}
      style={editing ? { animationDelay: `${(id.length % 5) * 40}ms` } : undefined}
    >
      {editing && (
        <div
          className="mb-2 flex items-center gap-2 rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] px-3 py-2 dark:border-[#F47822]/30 dark:bg-[#F47822]/10"
          data-testid={`section-bar-${id}`}
        >
          <button
            type="button"
            aria-label={t("dashboard.personalize.dragAria", { card: label })}
            data-testid={`drag-card-${id}`}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              controls.start(event);
            }}
            className="cursor-grab touch-none rounded-lg p-1 text-[#F47822] hover:bg-[#F47822]/10 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#3A3A3A] dark:text-white/85">
            {label}
          </span>

          {resizeCardId && (
            <button
              type="button"
              aria-label={
                isHalf
                  ? t("dashboard.personalize.fullWidthAria", { card: label })
                  : t("dashboard.personalize.halfWidthAria", { card: label })
              }
              aria-pressed={isHalf}
              title={
                isHalf
                  ? t("dashboard.personalize.fullWidth")
                  : t("dashboard.personalize.halfWidth")
              }
              data-testid={`width-card-${id}`}
              onClick={toggleWidth}
              className={[
                "rounded-lg p-1 transition",
                isHalf
                  ? "bg-[#F47822] text-white"
                  : "text-[#3A3A3A]/50 hover:bg-[#3A3A3A]/10 hover:text-[#F47822] dark:text-white/50 dark:hover:bg-white/10",
              ].join(" ")}
            >
              {isHalf ? (
                <RectangleHorizontal className="h-4 w-4" />
              ) : (
                <Columns2 className="h-4 w-4" />
              )}
            </button>
          )}

          {hideableCards.length > 0 ? (
            <button
              type="button"
              aria-label={t("dashboard.personalize.hideCard", { card: label })}
              data-testid={`hide-card-${id}`}
              onClick={hideSection}
              className="rounded-lg p-1 text-[#3A3A3A]/50 hover:bg-[#3A3A3A]/10 hover:text-[#F47822] dark:text-white/50 dark:hover:bg-white/10"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          ) : (
            <span
              title={t("dashboard.personalize.locked")}
              data-testid={`lock-card-${id}`}
              className="rounded-lg p-1 text-[#3A3A3A]/35 dark:text-white/35"
            >
              <Lock className="h-4 w-4" />
            </span>
          )}
        </div>
      )}

      {children}
    </Reorder.Item>
  );
}

interface DashboardSectionGhostProps {
  id: DashboardSectionId;
  onShow: (id: DashboardCardId) => void;
}

/** Dimmed placeholder so hidden optional sections can be restored while editing. */
export function DashboardSectionGhost({ id, onShow }: DashboardSectionGhostProps) {
  const { t } = useTranslation();
  const cards = SECTION_CARDS[id].filter(canHideCard);
  const label = cards
    .map((card) => t(`dashboard.personalize.cards.${card}`))
    .join(" · ");

  if (cards.length === 0) return null;

  const showSection = () => {
    cards.forEach((cardId) => onShow(cardId));
  };

  return (
    <div
      data-testid={`dashboard-ghost-${id}`}
      className="hbt-wiggle flex items-center gap-3 rounded-2xl border border-dashed border-[#3A3A3A]/20 bg-[#3A3A3A]/[0.03] px-4 py-3 dark:border-white/15 dark:bg-white/[0.03]"
    >
      <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#3A3A3A]/55 dark:text-white/55">
        {label}
      </span>

      <button
        type="button"
        aria-label={t("dashboard.personalize.showCard", { card: label })}
        data-testid={`show-section-${id}`}
        onClick={showSection}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#F47822] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#E96D18]"
      >
        {t("dashboard.personalize.show")}
      </button>
    </div>
  );
}
