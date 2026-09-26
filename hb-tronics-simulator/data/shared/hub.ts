/**
 * Hub "Continue your path" task rail (source: Simulator Hub). Learner-facing
 * title/meta and the coach line are Class-C prose resolved by the UI from the
 * `content` namespace (content.hub.task.<i>.* / content.hub.coach); only the
 * routing/marking (tool id, tag, status) lives here.
 */
export interface HubTask {
  tool: string; // module id for deep-link
  tag: string; // instrument marking (Class-B)
  status: "resume" | "new" | "retry" | "guided";
}

export const HUB_TASKS: HubTask[] = [
  { tool: "oscilloscope", tag: "OSC", status: "resume" },
  { tool: "schematic", tag: "WDG", status: "new" },
  { tool: "multimeter", tag: "DMM", status: "retry" },
  { tool: "scanner", tag: "SCN", status: "guided" },
];
