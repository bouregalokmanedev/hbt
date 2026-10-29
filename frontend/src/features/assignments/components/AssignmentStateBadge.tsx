import { useTranslation } from "react-i18next";

import type { LearnerAssignmentState } from "../utils/assignment-format";

const tones: Record<LearnerAssignmentState, string> = {
  graded:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  submitted:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  overdue:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  assigned:
    "border-[#F47822]/25 bg-[#FFF8F4] text-[#F47822] dark:border-[#F47822]/25 dark:bg-[#F47822]/10",
};

export function AssignmentStateBadge({
  state,
  testId,
}: {
  state: LearnerAssignmentState;
  testId?: string;
}) {
  const { t } = useTranslation();

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${tones[state]}`}
    >
      {t(`assignments.status.${state}`)}
    </span>
  );
}
