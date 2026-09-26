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
  type DashboardSectionId,
} from "../layout/layout";

export function useDashboardLayout(
  isAvailable: (id: DashboardCardId) => boolean,
  userId?: string | null,
) {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    setLayoutOwner(userId ?? null);
    return loadLayout(userId ?? null);
  });

  // Switch storage scope when the signed-in student is known / changes.
  useEffect(() => {
    setLayoutOwner(userId ?? null);
    setLayout(loadLayout(userId ?? null));
  }, [userId]);

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
    setLayout(resetLayout());
  }, []);

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
