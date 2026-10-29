import { useQuery } from "@tanstack/react-query";

import {
  getBootcampRegistrations,
  getInstructorBootcamp,
  getInstructorBootcamps,
  type BootcampRegistrationParams,
  type InstructorBootcampParams,
} from "../api/instructorBootcampsApi";

export function useInstructorBootcamps(
  params: InstructorBootcampParams = {},
) {
  return useQuery({
    queryKey: ["instructor", "bootcamps", params],
    queryFn: () => getInstructorBootcamps(params),
    staleTime: 30_000,
  });
}

export function useInstructorBootcamp(bootcampId: string | undefined) {
  return useQuery({
    queryKey: ["instructor", "bootcamp", bootcampId],
    queryFn: () => getInstructorBootcamp(bootcampId as string),
    enabled: Boolean(bootcampId),
    staleTime: 20_000,
  });
}

export function useBootcampRegistrations(
  bootcampId: string | undefined,
  params: BootcampRegistrationParams = {},
) {
  return useQuery({
    queryKey: ["instructor", "bootcamp", bootcampId, "registrations", params],
    queryFn: () => getBootcampRegistrations(bootcampId as string, params),
    enabled: Boolean(bootcampId),
    staleTime: 15_000,
  });
}
