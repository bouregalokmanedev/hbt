import { useQuery } from "@tanstack/react-query";

import {
    getInstructorDashboard,
} from "../api/instructorApi";

export function useInstructorDashboard() {
    return useQuery({
        queryKey: [
            "instructor",
            "dashboard",
        ],
        queryFn: getInstructorDashboard,
        staleTime: 30_000,
    });
}