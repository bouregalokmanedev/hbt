import { useCallback, useEffect, useMemo, useState } from "react";

import {
  bootcampsApi,
  type BootcampListParams,
  type BootcampCalendarParams,
} from "../api/bootcamps.api";
import type {
  Bootcamp,
  BootcampPaginationMeta,
  BootcampSchedule,
} from "../types/bootcamp.types";

export function useBootcamps(params: BootcampListParams = {}) {
  const { search, level, location, page, per_page } = params;
  const stableParams = useMemo(
    () => ({ search, level, location, page, per_page }),
    [search, level, location, page, per_page],
  );

  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [pagination, setPagination] = useState<BootcampPaginationMeta | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await bootcampsApi.list(stableParams);

      setBootcamps(Array.isArray(response.data) ? response.data : []);
      setPagination(response.meta ?? null);
    } catch (requestError) {
      setBootcamps([]);
      setPagination(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load bootcamps.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [stableParams]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    bootcamps,
    pagination,
    isLoading,
    error,
    reload: load,
  };
}

export function useBootcamp(bootcampId: string | undefined) {
  const [bootcamp, setBootcamp] = useState<Bootcamp | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(bootcampId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!bootcampId) {
      setBootcamp(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setBootcamp(await bootcampsApi.get(bootcampId));
    } catch (requestError) {
      setBootcamp(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load this bootcamp.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [bootcampId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bootcamp, isLoading, error, reload: load };
}

export function useBootcampCalendar(
  params: BootcampCalendarParams = {},
) {
  const [schedules, setSchedules] = useState<BootcampSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const from = params.from;
  const to = params.to;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await bootcampsApi.calendar({ from, to });
      setSchedules(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setSchedules([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the bootcamp calendar.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return { schedules, isLoading, error, reload: load };
}
