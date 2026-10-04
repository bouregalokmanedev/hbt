import { useCallback, useEffect, useMemo, useState } from "react";

import {
  applySectionReorder,
  getVisibleSections,
  hideCard,
  loadLayout,
  resetLayout,
  setLayoutOwner,
  showCard,
  toggleCardWidth,
  type DashboardCardId,
  type DashboardLayout,
  type DashboardLayoutScope,
  type DashboardSectionId,
} from "../layout/layout";

/**
 * Shared by the student and instructor dashboards. `scope` selects which
 * section registry and which localStorage slot are used, so the two layouts
 * never overwrite one another.
 */
export function useDashboardLayout(
  isAvailable: (id: DashboardCardId) => boolean,
  userId?: string | null,
  scope: DashboardLayoutScope = "student",
) {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    setLayoutOwner(userId ?? null);
    return loadLayout(userId ?? null, scope);
  });

  // Switch storage scope when the signed-in user is known / changes.
  useEffect(() => {
    setLayoutOwner(userId ?? null);
    setLayout(loadLayout(userId ?? null, scope));
  }, [userId, scope]);

  const visibleSections = useMemo(
    () => getVisibleSections(layout, isAvailable),
    [layout, isAvailable],
  );

  const hide = useCallback((id: DashboardCardId) => {
    setLayout((current) => hideCard(current, id));
  }, []);

  const show = useCallback((id: DashboardCardId) => {
    setLayout((current) => showCard(current, id));
  }, []);

  const reorder = useCallback((nextVisible: DashboardSectionId[]) => {
    setLayout((current) => applySectionReorder(current, nextVisible));
  }, []);

  const toggleWidth = useCallback((id: DashboardCardId) => {
    setLayout((current) => toggleCardWidth(current, id));
  }, []);

  const reset = useCallback(() => {
    setLayout(resetLayout(scope, userId ?? null));
  }, [scope, userId]);

  return {
    layout,
    visibleSections,
    hide,
    show,
    reorder,
    toggleWidth,
    reset,
  };
}
