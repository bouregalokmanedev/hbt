import { useCallback, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Reorder } from "framer-motion";
import { Check, RefreshCw, RotateCcw } from "lucide-react";

import { ComingSoonCards } from "../components/ComingSoonCards";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardStats } from "../components/DashboardStats";
import { CurrentLearning } from "../components/CurrentLearning";
import { UpcomingAssessments } from "../components/UpcomingAssessments";
import { RecentActivity } from "../components/RecentActivity";
import { WeeklyActivity } from "../components/WeeklyActivity";
import { Achievements } from "../components/Achievements";
import { AiMentorCard } from "../components/AiMentorCard";
import { BadgeUnlockedModal } from "../components/BadgeUnlockedModal";
import { CohortOverviewCard, SkillGapCard } from "../components/SkillGapCard";
import { LeaderboardCard } from "../components/LeaderboardCard";
import { CertificatesCard } from "../components/CertificatesCard";
import { InviteFriendsCard } from "../components/InviteFriendsCard";
import { NotificationsCard } from "../components/NotificationsCard";
import { FavoritesCard } from "../components/FavoritesCard";
import {
  DashboardSectionGhost,
  DashboardSectionSlot,
} from "../components/personalize/DashboardCardSlot";
import { useDashboard } from "../hooks/useDashboard";
import { useDashboardLayout } from "../hooks/useDashboardLayout";
import { useDashboardUiStore } from "../stores/dashboard-ui.store";

import {
  SECTION_CARDS,
  canHideCard,
  canResizeCard,
  getCardWidth,
  isSectionHalfWidth,
  type DashboardCardId,
  type DashboardSectionId,
} from "../layout/layout";
import type { DashboardData } from "../types/dashboard.types";

function isAvailableFactory(dashboard: DashboardData) {
  return (id: DashboardCardId) => {
    if (id === "cohortOverview") return Boolean(dashboard.cohort_overview);
    return true;
  };
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { dashboard, isLoading, error, refetch } = useDashboard();
  const customizing = useDashboardUiStore((state) => state.customizing);
  const setCustomizing = useDashboardUiStore(
    (state) => state.setCustomizing,
  );

  const isAvailable = useMemo(
    () => (dashboard ? isAvailableFactory(dashboard) : () => true),
    [dashboard],
  );

  const {
    layout,
    visibleSections,
    hide,
    show,
    reorder,
    toggleWidth,
    reset,
  } = useDashboardLayout(isAvailable, dashboard?.user?.id ?? null);

  const closeEditing = useCallback(() => setCustomizing(false), [setCustomizing]);

  const handleHide = useCallback(
    (id: DashboardCardId) => hide(id),
    [hide],
  );

  const handleToggleWidth = useCallback(
    (id: DashboardCardId) => toggleWidth(id),
    [toggleWidth],
  );

  /**
   * Full-width cards span both columns. Half-width resizable cards take one
   * column so two adjacent half cards share a row (lg+); stacked on mobile.
   */
  const sectionSpanClass = useCallback(
    (sectionId: DashboardSectionId): string => {
      if (isSectionHalfWidth(layout, sectionId)) {
        return "col-span-full lg:col-span-1";
      }
      return "col-span-full";
    },
    [layout],
  );

  const ghostSections = useMemo(() => {
    if (!customizing) return [];
    return layout.order.filter((sectionId) => {
      if (visibleSections.includes(sectionId)) return false;
      return SECTION_CARDS[sectionId].some(
        (cardId) => canHideCard(cardId) && isAvailable(cardId),
      );
    });
  }, [customizing, layout.order, visibleSections, isAvailable]);

  if (isLoading && !dashboard) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#F47822]/20 border-t-[#F47822]" />

          <p className="mt-4 text-sm text-[#3A3A3A]/50 dark:text-white/50">
            {t("dashboard.page.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
            <RefreshCw className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
            {t("dashboard.page.loadError")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">{error}</p>

          <button
            type="button"
            onClick={refetch}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(244,120,34,0.18)] transition hover:bg-[#E96D18]"
          >
            <RefreshCw className="h-4 w-4" />
            {t("dashboard.page.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const showWeekly = !layout.hidden.includes("weeklyActivity");
  const showAchievements = !layout.hidden.includes("achievements");

  const renderSection = (sectionId: DashboardSectionId): ReactNode => {
    switch (sectionId) {
      case "stats":
        return (
          <div data-testid="dashboard-card-stats">
            <DashboardStats stats={dashboard.stats} />
          </div>
        );
      case "learningRow":
        return (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div data-testid="dashboard-card-continueLearning">
              <CurrentLearning courses={dashboard.current_learning} />
            </div>
            <div data-testid="dashboard-card-upcomingAssessments">
              <UpcomingAssessments assessments={dashboard.upcoming_assessments} />
            </div>
          </div>
        );
      case "recentActivity":
        return (
          <div data-testid="dashboard-card-recentActivity">
            <RecentActivity activities={dashboard.recent_activity} />
          </div>
        );
      case "activityRow":
        if (showWeekly && showAchievements) {
          return (
            <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
              <div data-testid="dashboard-card-weeklyActivity">
                <WeeklyActivity activity={dashboard.weekly_activity} />
              </div>
              <div data-testid="dashboard-card-achievements">
                <Achievements achievements={dashboard.achievements} />
              </div>
            </div>
          );
        }
        if (showWeekly) {
          return (
            <div data-testid="dashboard-card-weeklyActivity">
              <WeeklyActivity activity={dashboard.weekly_activity} />
            </div>
          );
        }
        if (showAchievements) {
          return (
            <div data-testid="dashboard-card-achievements">
              <Achievements achievements={dashboard.achievements} />
            </div>
          );
        }
        return null;
      case "skillGap":
        return (
          <div data-testid="dashboard-card-skillGap">
            <SkillGapCard
              gaps={dashboard.skill_gaps ?? []}
              reviewDue={dashboard.review_due ?? []}
            />
          </div>
        );
      case "cohortOverview":
        return dashboard.cohort_overview ? (
          <div data-testid="dashboard-card-cohortOverview">
            <CohortOverviewCard cohort={dashboard.cohort_overview} />
          </div>
        ) : null;
      case "leaderboard":
        return (
          <div data-testid="dashboard-card-leaderboard">
            <LeaderboardCard />
          </div>
        );
      case "aiMentor":
        return (
          <div data-testid="dashboard-card-aiMentor">
            <AiMentorCard mentor={dashboard.ai_mentor} />
          </div>
        );
      case "certificates":
        return (
          <div data-testid="dashboard-card-certificates">
            <CertificatesCard />
          </div>
        );
      case "inviteFriends":
        return (
          <div data-testid="dashboard-card-inviteFriends">
            <InviteFriendsCard />
          </div>
        );
      case "notifications":
        return (
          <div data-testid="dashboard-card-notifications">
            <NotificationsCard />
          </div>
        );
      case "favorites":
        return (
          <div data-testid="dashboard-card-favorites">
            <FavoritesCard />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <div className="space-y-6">
          {/* Header — never hidden, never reordered */}
          <DashboardHeader
            user={dashboard.user}
            progression={dashboard.progression}
            achievements={dashboard.achievements}
          />

          {/* Reorderable sections on a 2-col grid — half-width cards share a row */}
          <Reorder.Group
            axis="y"
            values={visibleSections}
            onReorder={reorder}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            as="div"
          >
            {visibleSections.map((sectionId) => {
              const cards = SECTION_CARDS[sectionId];
              const resizeCardId =
                cards.length === 1 && canResizeCard(cards[0]) ? cards[0] : null;

              return (
                <DashboardSectionSlot
                  key={sectionId}
                  id={sectionId}
                  editing={customizing}
                  onHide={handleHide}
                  width={
                    resizeCardId ? getCardWidth(layout, resizeCardId) : "full"
                  }
                  onToggleWidth={handleToggleWidth}
                  spanClassName={sectionSpanClass(sectionId)}
                >
                  {renderSection(sectionId)}
                </DashboardSectionSlot>
              );
            })}
          </Reorder.Group>

          {customizing && ghostSections.length > 0 && (
            <div className="space-y-3" data-testid="dashboard-ghosts">
              {ghostSections.map((sectionId) => (
                <DashboardSectionGhost key={sectionId} id={sectionId} onShow={show} />
              ))}
            </div>
          )}

          {/* Daily Challenges + Homework — fixed, not hideable/movable */}
          <div data-testid="dashboard-fixed-footer">
            <ComingSoonCards />
          </div>
        </div>
      </div>

      {customizing && (
        <div
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[#3A3A3A]/12 bg-white/95 p-1.5 shadow-[0_18px_50px_rgba(58,58,58,0.18)] backdrop-blur-md dark:border-white/12 dark:bg-[#1b1b20]/95"
          data-testid="customize-toolbar"
          role="toolbar"
          aria-label={t("dashboard.personalize.title")}
        >
          <button
            type="button"
            data-testid="customize-reset"
            onClick={reset}
            className="group inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3A3A3A]/65 transition hover:bg-[#3A3A3A]/6 hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40 dark:text-white/65 dark:hover:bg-white/8 dark:hover:text-[#F47822]"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-180" />
            {t("dashboard.personalize.reset")}
          </button>

          <span
            aria-hidden="true"
            className="h-6 w-px bg-[#3A3A3A]/10 dark:bg-white/10"
          />

          <button
            type="button"
            data-testid="customize-done"
            onClick={closeEditing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_22px_rgba(244,120,34,0.35)] transition hover:brightness-[1.06] hover:shadow-[0_10px_28px_rgba(244,120,34,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/50 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <Check className="h-4 w-4" />
            {t("dashboard.personalize.done")}
          </button>
        </div>
      )}

      <BadgeUnlockedModal
        userId={dashboard.user.id}
        achievements={dashboard.achievements}
      />
    </main>
  );
}
