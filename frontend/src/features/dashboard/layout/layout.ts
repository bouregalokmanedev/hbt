export const DASHBOARD_LAYOUT_STORAGE_KEY = "hbt:dashboard-layout";

/**
 * Layout is scoped per student so shared browsers don't leak one
 * student's customize style onto another. Set when the dashboard loads.
 */
let layoutOwnerUserId: string | null = null;

export function setLayoutOwner(userId: string | null): void {
  layoutOwnerUserId = userId;
}

export function getLayoutOwner(): string | null {
  return layoutOwnerUserId;
}

/** Per-user storage key. Falls back to the shared key only when no user is known. */
export function getLayoutStorageKey(userId?: string | null): string {
  const owner = userId ?? layoutOwnerUserId;
  return owner
    ? `${DASHBOARD_LAYOUT_STORAGE_KEY}:${owner}`
    : DASHBOARD_LAYOUT_STORAGE_KEY;
}

export type DashboardCardId =
  | "stats"
  | "continueLearning"
  | "upcomingAssessments"
  | "recentActivity"
  | "weeklyActivity"
  | "achievements"
  | "skillGap"
  | "cohortOverview"
  | "leaderboard"
  | "aiMentor"
  | "certificates"
  | "inviteFriends"
  | "notifications"
  | "favorites";

/** Reorderable page blocks — pairs keep their original grid layouts. */
export type DashboardSectionId =
  | "stats"
  | "learningRow"
  | "recentActivity"
  | "activityRow"
  | "skillGap"
  | "cohortOverview"
  | "leaderboard"
  | "aiMentor"
  | "certificates"
  | "inviteFriends"
  | "notifications"
  | "favorites";

export type DashboardCardWidth = "full" | "half";

export interface DashboardLayout {
  order: DashboardSectionId[];
  hidden: DashboardCardId[];
  /** Only stores cards set to "half" — missing key means full width. */
  widths?: Partial<Record<DashboardCardId, DashboardCardWidth>>;
}

export const MOVABLE_CARDS: DashboardCardId[] = [
  "stats",
  "continueLearning",
  "upcomingAssessments",
  "recentActivity",
  "weeklyActivity",
  "achievements",
  "skillGap",
  "cohortOverview",
  "leaderboard",
  "aiMentor",
  "certificates",
  "inviteFriends",
  "notifications",
  "favorites",
];

export const SECTION_ORDER: DashboardSectionId[] = [
  "stats",
  "learningRow",
  "recentActivity",
  "activityRow",
  "skillGap",
  "cohortOverview",
  "leaderboard",
  "aiMentor",
  "certificates",
  "inviteFriends",
  "notifications",
  "favorites",
];

export const SECTION_CARDS: Record<DashboardSectionId, DashboardCardId[]> = {
  stats: ["stats"],
  learningRow: ["continueLearning", "upcomingAssessments"],
  recentActivity: ["recentActivity"],
  activityRow: ["weeklyActivity", "achievements"],
  skillGap: ["skillGap"],
  cohortOverview: ["cohortOverview"],
  leaderboard: ["leaderboard"],
  aiMentor: ["aiMentor"],
  certificates: ["certificates"],
  inviteFriends: ["inviteFriends"],
  notifications: ["notifications"],
  favorites: ["favorites"],
};

const CARD_TO_SECTION: Record<DashboardCardId, DashboardSectionId> = {
  stats: "stats",
  continueLearning: "learningRow",
  upcomingAssessments: "learningRow",
  recentActivity: "recentActivity",
  weeklyActivity: "activityRow",
  achievements: "activityRow",
  skillGap: "skillGap",
  cohortOverview: "cohortOverview",
  leaderboard: "leaderboard",
  aiMentor: "aiMentor",
  certificates: "certificates",
  inviteFriends: "inviteFriends",
  notifications: "notifications",
  favorites: "favorites",
};

/** Can be reordered but never hidden. */
export const ALWAYS_VISIBLE_CARDS: ReadonlySet<DashboardCardId> = new Set([
  "continueLearning",
  "upcomingAssessments",
  "aiMentor",
]);

/** Hidden until the student restores them while customizing. */
export const DEFAULT_HIDDEN: DashboardCardId[] = [
  "certificates",
  "notifications",
  "favorites",
];

/**
 * Single-card sections that can shrink to half width so two cards share a row.
 * Start set: AI mentor, recent activity, leaderboard, certificates, favourites.
 */
export const RESIZABLE_CARDS: DashboardCardId[] = [
  "aiMentor",
  "recentActivity",
  "leaderboard",
  "certificates",
  "favorites",
];

const RESIZABLE_SET: ReadonlySet<DashboardCardId> = new Set(RESIZABLE_CARDS);

const MOVABLE_SET: ReadonlySet<string> = new Set(MOVABLE_CARDS);
const SECTION_SET: ReadonlySet<string> = new Set(SECTION_ORDER);

export function isMovableCard(id: string): id is DashboardCardId {
  return MOVABLE_SET.has(id);
}

export function isSectionId(id: string): id is DashboardSectionId {
  return SECTION_SET.has(id);
}

export function canHideCard(id: DashboardCardId): boolean {
  return !ALWAYS_VISIBLE_CARDS.has(id);
}

export function canResizeCard(id: DashboardCardId): boolean {
  return RESIZABLE_SET.has(id);
}

export function getCardWidth(
  layout: DashboardLayout,
  id: DashboardCardId,
): DashboardCardWidth {
  return layout.widths?.[id] === "half" ? "half" : "full";
}

/** A single-card section renders at half width when its only card is half. */
export function isSectionHalfWidth(
  layout: DashboardLayout,
  sectionId: DashboardSectionId,
): boolean {
  const cards = SECTION_CARDS[sectionId];
  if (cards.length !== 1) return false;
  return getCardWidth(layout, cards[0]) === "half";
}

function defaultLayout(): DashboardLayout {
  return {
    order: [...SECTION_ORDER],
    hidden: [...DEFAULT_HIDDEN],
    widths: {},
  };
}

function isStoredLayout(value: unknown): value is Partial<DashboardLayout> {
  return typeof value === "object" && value !== null;
}

/**
 * Merge stored layout with the section registry. Accepts legacy card-id
 * orders (maps each card to its section) and forces always-visible cards on.
 */
export function normalizeLayout(raw: unknown): DashboardLayout {
  const base = defaultLayout();
  if (!isStoredLayout(raw)) return base;

  const seen = new Set<DashboardSectionId>();
  const order: DashboardSectionId[] = [];

  const pushSection = (id: string) => {
    if (isSectionId(id) && !seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  };

  if (Array.isArray(raw.order)) {
    for (const entry of raw.order) {
      if (typeof entry !== "string") continue;
      if (isSectionId(entry)) {
        pushSection(entry);
      } else if (isMovableCard(entry)) {
        pushSection(CARD_TO_SECTION[entry]);
      }
    }
  }
  SECTION_ORDER.forEach(pushSection);

  const hidden = Array.isArray(raw.hidden)
    ? raw.hidden.filter(
        (id): id is DashboardCardId =>
          isMovableCard(id) && canHideCard(id as DashboardCardId),
      )
    : [...DEFAULT_HIDDEN];

  const widths: Partial<Record<DashboardCardId, DashboardCardWidth>> = {};
  if (raw.widths && typeof raw.widths === "object") {
    for (const cardId of RESIZABLE_CARDS) {
      if ((raw.widths as Record<string, unknown>)[cardId] === "half") {
        widths[cardId] = "half";
      }
    }
  }

  return {
    order,
    hidden: hidden.filter(
      (id, index) =>
        hidden.indexOf(id) === index && !ALWAYS_VISIBLE_CARDS.has(id),
    ),
    widths,
  };
}

export function loadLayout(userId?: string | null): DashboardLayout {
  try {
    const raw = window.localStorage.getItem(getLayoutStorageKey(userId));
    if (!raw) return defaultLayout();
    return normalizeLayout(JSON.parse(raw));
  } catch {
    return defaultLayout();
  }
}

export function saveLayout(layout: DashboardLayout, userId?: string | null): void {
  try {
    window.localStorage.setItem(
      getLayoutStorageKey(userId),
      JSON.stringify(layout),
    );
  } catch {
    // Storage unavailable — layout stays in memory for this session.
  }
}

export function resetLayout(): DashboardLayout {
  const next = defaultLayout();
  saveLayout(next);
  return next;
}

export function hideCard(
  layout: DashboardLayout,
  id: DashboardCardId,
): DashboardLayout {
  if (!canHideCard(id) || layout.hidden.includes(id)) return layout;
  const next: DashboardLayout = {
    order: layout.order,
    hidden: [...layout.hidden, id],
    widths: layout.widths,
  };
  saveLayout(next);
  return next;
}

export function showCard(
  layout: DashboardLayout,
  id: DashboardCardId,
): DashboardLayout {
  if (!isMovableCard(id) || !layout.hidden.includes(id)) return layout;
  const next: DashboardLayout = {
    order: layout.order,
    hidden: layout.hidden.filter((cardId) => cardId !== id),
    widths: layout.widths,
  };
  saveLayout(next);
  return next;
}

/** Toggle a resizable card between full and half width. Persists immediately. */
export function toggleCardWidth(
  layout: DashboardLayout,
  id: DashboardCardId,
): DashboardLayout {
  if (!canResizeCard(id)) return layout;
  const widths: Partial<Record<DashboardCardId, DashboardCardWidth>> = {
    ...layout.widths,
  };
  if (widths[id] === "half") {
    delete widths[id];
  } else {
    widths[id] = "half";
  }
  const next: DashboardLayout = {
    order: layout.order,
    hidden: layout.hidden,
    widths,
  };
  saveLayout(next);
  return next;
}

/** A section renders when at least one of its cards is visible + available. */
export function isSectionVisible(
  layout: DashboardLayout,
  sectionId: DashboardSectionId,
  isAvailable: (id: DashboardCardId) => boolean,
): boolean {
  return SECTION_CARDS[sectionId].some(
    (cardId) => !layout.hidden.includes(cardId) && isAvailable(cardId),
  );
}

export function applySectionReorder(
  layout: DashboardLayout,
  nextVisible: DashboardSectionId[],
): DashboardLayout {
  const next: DashboardLayout = {
    order: [...nextVisible],
    hidden: layout.hidden,
    widths: layout.widths,
  };
  saveLayout(next);
  return next;
}

export function getVisibleSections(
  layout: DashboardLayout,
  isAvailable: (id: DashboardCardId) => boolean,
): DashboardSectionId[] {
  return layout.order.filter((sectionId) =>
    isSectionVisible(layout, sectionId, isAvailable),
  );
}

export function getVisibleCards(
  layout: DashboardLayout,
  isAvailable: (id: DashboardCardId) => boolean,
): DashboardCardId[] {
  const cards: DashboardCardId[] = [];
  for (const sectionId of layout.order) {
    for (const cardId of SECTION_CARDS[sectionId]) {
      if (!layout.hidden.includes(cardId) && isAvailable(cardId)) {
        cards.push(cardId);
      }
    }
  }
  return cards;
}

export function getHiddenCards(layout: DashboardLayout): DashboardCardId[] {
  return MOVABLE_CARDS.filter((id) => layout.hidden.includes(id));
}
