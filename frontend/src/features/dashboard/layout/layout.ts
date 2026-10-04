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

/**
 * Per-user, per-dashboard storage key. The student suffix is empty so existing
 * saved layouts keep loading; falls back to the shared key when no user is
 * known.
 */
export function getLayoutStorageKey(
  userId?: string | null,
  scope: DashboardLayoutScope = "student",
): string {
  const owner = userId ?? layoutOwnerUserId;
  const suffix = scope === "student" ? "" : `:${scope}`;
  return owner
    ? `${DASHBOARD_LAYOUT_STORAGE_KEY}:${owner}${suffix}`
    : `${DASHBOARD_LAYOUT_STORAGE_KEY}${suffix}`;
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
  | "favorites"
  // Instructor dashboard
  | "instructorStats"
  | "progression"
  | "attention"
  | "topCourses"
  | "momentum"
  | "simulatorLab"
  | "pipeline"
  | "learningPulse"
  | "instructorActivity"
  | "checklist";

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
  | "favorites"
  // Instructor dashboard
  | "instructorStats"
  | "progression"
  | "attention"
  | "topCourses"
  | "momentum"
  | "simulatorLab"
  | "pipelineRow"
  | "instructorActivityRow";

/**
 * A student and an instructor can be the same person. Their layouts are stored
 * separately so opening one dashboard never rewrites the other's order.
 */
export type DashboardLayoutScope = "student" | "instructor";

export type DashboardCardWidth = "full" | "half";

export interface DashboardLayout {
  scope: DashboardLayoutScope;
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
  "instructorStats",
  "progression",
  "attention",
  "topCourses",
  "momentum",
  "simulatorLab",
  "pipeline",
  "learningPulse",
  "instructorActivity",
  "checklist",
];

/**
 * Per-dashboard default order. Each scope only ever sees its own sections, so
 * a student who also teaches can never get an instructor card in their layout.
 */
export const SECTION_ORDER: Record<DashboardLayoutScope, DashboardSectionId[]> = {
  student: [
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
  ],
  instructor: [
    "instructorStats",
    "progression",
    "attention",
    "topCourses",
    "momentum",
    "simulatorLab",
    "pipelineRow",
    "instructorActivityRow",
  ],
};

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
  instructorStats: ["instructorStats"],
  progression: ["progression"],
  attention: ["attention"],
  topCourses: ["topCourses"],
  momentum: ["momentum"],
  simulatorLab: ["simulatorLab"],
  pipelineRow: ["pipeline", "learningPulse"],
  instructorActivityRow: ["instructorActivity", "checklist"],
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
  instructorStats: "instructorStats",
  progression: "progression",
  attention: "attention",
  topCourses: "topCourses",
  momentum: "momentum",
  simulatorLab: "simulatorLab",
  pipeline: "pipelineRow",
  learningPulse: "pipelineRow",
  instructorActivity: "instructorActivityRow",
  checklist: "instructorActivityRow",
};

/** Can be reordered but never hidden. */
export const ALWAYS_VISIBLE_CARDS: ReadonlySet<DashboardCardId> = new Set([
  "continueLearning",
  "upcomingAssessments",
  "aiMentor",
  "instructorStats",
]);

/** Hidden until the student restores them while customizing. */
export const DEFAULT_HIDDEN: DashboardCardId[] = [
  "certificates",
  "notifications",
  "favorites",
];

/**
 * Hidden until the instructor restores them. Everything starts visible here —
 * a brand-new instructor dashboard should look complete, not curated away.
 */
const DEFAULT_HIDDEN_BY_SCOPE: Record<DashboardLayoutScope, DashboardCardId[]> = {
  student: DEFAULT_HIDDEN,
  instructor: [],
};

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
  "progression",
  "attention",
  "topCourses",
  "momentum",
];

const RESIZABLE_SET: ReadonlySet<DashboardCardId> = new Set(RESIZABLE_CARDS);

const MOVABLE_SET: ReadonlySet<string> = new Set(MOVABLE_CARDS);
const SECTION_SET: ReadonlySet<string> = new Set(
  Object.values(SECTION_ORDER).flat(),
);

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

function defaultLayout(scope: DashboardLayoutScope = "student"): DashboardLayout {
  return {
    scope,
    order: [...SECTION_ORDER[scope]],
    hidden: [...DEFAULT_HIDDEN_BY_SCOPE[scope]],
    widths: {},
  };
}

/** Every card that belongs to the given dashboard. */
function cardsOfScope(scope: DashboardLayoutScope): Set<DashboardCardId> {
  const cards = new Set<DashboardCardId>();
  for (const sectionId of SECTION_ORDER[scope]) {
    for (const cardId of SECTION_CARDS[sectionId]) cards.add(cardId);
  }
  return cards;
}

function isStoredLayout(value: unknown): value is Partial<DashboardLayout> {
  return typeof value === "object" && value !== null;
}

/**
 * Merge stored layout with the section registry. Accepts legacy card-id
 * orders (maps each card to its section) and forces always-visible cards on.
 *
 * Entries belonging to the other dashboard are dropped rather than kept, so a
 * layout written by an older build can never leak across scopes.
 */
export function normalizeLayout(
  raw: unknown,
  scope: DashboardLayoutScope = "student",
): DashboardLayout {
  const base = defaultLayout(scope);
  if (!isStoredLayout(raw)) return base;

  const scopeSections = SECTION_ORDER[scope];
  const scopeCards = cardsOfScope(scope);

  const seen = new Set<DashboardSectionId>();
  const order: DashboardSectionId[] = [];

  const pushSection = (id: string) => {
    if (scopeSections.includes(id as DashboardSectionId) && !seen.has(id as DashboardSectionId)) {
      seen.add(id as DashboardSectionId);
      order.push(id as DashboardSectionId);
    }
  };

  if (Array.isArray(raw.order)) {
    for (const entry of raw.order) {
      if (typeof entry !== "string") continue;
      if (scopeSections.includes(entry as DashboardSectionId)) {
        pushSection(entry);
      } else if (isMovableCard(entry)) {
        pushSection(CARD_TO_SECTION[entry]);
      }
    }
  }
  scopeSections.forEach(pushSection);

  const hidden = Array.isArray(raw.hidden)
    ? raw.hidden.filter(
        (id): id is DashboardCardId =>
          scopeCards.has(id) &&
          isMovableCard(id) &&
          canHideCard(id as DashboardCardId),
      )
    : [...DEFAULT_HIDDEN_BY_SCOPE[scope]];

  const widths: Partial<Record<DashboardCardId, DashboardCardWidth>> = {};
  if (raw.widths && typeof raw.widths === "object") {
    for (const cardId of RESIZABLE_CARDS) {
      if ((raw.widths as Record<string, unknown>)[cardId] === "half") {
        widths[cardId] = "half";
      }
    }
  }

  return {
    scope,
    order,
    hidden: hidden.filter(
      (id, index) =>
        hidden.indexOf(id) === index && !ALWAYS_VISIBLE_CARDS.has(id),
    ),
    widths,
  };
}

export function loadLayout(
  userId?: string | null,
  scope: DashboardLayoutScope = "student",
): DashboardLayout {
  try {
    const raw = window.localStorage.getItem(getLayoutStorageKey(userId, scope));
    if (!raw) return defaultLayout(scope);
    return normalizeLayout(JSON.parse(raw), scope);
  } catch {
    return defaultLayout(scope);
  }
}

export function saveLayout(layout: DashboardLayout, userId?: string | null): void {
  try {
    window.localStorage.setItem(
      getLayoutStorageKey(userId, layout.scope),
      JSON.stringify(layout),
    );
  } catch {
    // Storage unavailable — layout stays in memory for this session.
  }
}

export function resetLayout(
  scope: DashboardLayoutScope = "student",
  userId?: string | null,
): DashboardLayout {
  const next = defaultLayout(scope);
  saveLayout(next, userId);
  return next;
}

export function hideCard(
  layout: DashboardLayout,
  id: DashboardCardId,
): DashboardLayout {
  if (!canHideCard(id) || layout.hidden.includes(id)) return layout;
  const next: DashboardLayout = {
    scope: layout.scope,
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
    scope: layout.scope,
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
    scope: layout.scope,
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
    scope: layout.scope,
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
