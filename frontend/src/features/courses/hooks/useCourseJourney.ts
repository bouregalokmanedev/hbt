import { useCallback, useEffect, useState } from "react";

import { getCourseJourney } from "../api/courses.api";
import type { CourseJourney } from "../types/journey.types";

interface UseCourseJourneyResult {
  journey: CourseJourney | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Load the learner's single source of truth for "where am I and what next?".
 * Disabled for signed-out visitors and users without full course access, since
 * the endpoint is enrolment-gated.
 */
export function useCourseJourney(
  courseId: string | undefined,
  enabled = true,
): UseCourseJourneyResult {
  const [journey, setJourney] = useState<CourseJourney | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId || !enabled) {
      setJourney(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setJourney(await getCourseJourney(courseId));
    } catch (reason) {
      setJourney(null);
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load your course journey.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { journey, isLoading, error, reload: load };
}
