import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { locales } from "@/lib/i18n/config";
import { SCOPE_EXERCISES, OSC_FAULT_IDS } from "@/data/oscilloscope/scope";
import { DTC_DETAIL, TREE, TRAINING_STEPS, TRAINING_ANSWERS, ASSISTANT_TURNS } from "@/data/scanner";
import { ADAS_ITEMS, ADAS_ACTIVE } from "@/features/scanner/data/adas";
import { MM_PROCEDURES } from "@/data/multimeter/procedures";
import { LOC_COMPONENTS } from "@/data/location/atlas";
import { SCH_TRACES, SCH_TASKS, SCH_EXAM } from "@/data/schematic/workspace";
import { REPORTS, PROGRESS } from "@/data/record";
import { MODS } from "@/data/shared/modules";
import { HUB_TASKS } from "@/data/shared/hub";
import { HERO_PANELS, FUNCTION_MODULES, META_CARDS } from "@/features/scanner/data/workstation";
import { SCENARIO_LIBRARY, ACTIVE_SCENARIO } from "@/features/scanner/data/training";
import { REPORT_MEASUREMENTS } from "@/features/scanner/data/report";

/** Strip a `content:` sentinel (used in SessionResult / seeded records) to a bare content path. */
const unsentinel = (s: string) => (s.startsWith("content:") ? s.slice("content:".length) : s);

const msgDir = fileURLToPath(new URL("../../messages/", import.meta.url));

function loadContent(locale: string): Record<string, any> {
  return JSON.parse(readFileSync(`${msgDir}${locale}/content.json`, "utf8"));
}

function get(obj: any, path: string): unknown {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

/**
 * Class-C localization (14 §0 / F7): learner-facing prose is emitted by engines/data
 * as content ids and resolved by the UI from the `content` namespace. These tests bind
 * the *actual* ids referenced in the data/engine layer to their EN/AR/FR translations
 * so the two cannot drift — every id used in code must exist in all three locales.
 */
describe("Class-C content coverage", () => {
  /** Assert a dotted content path is a non-empty string in every locale. */
  const requireString = (paths: string[]) => requireStringIn(paths, [...locales]);
  /** Assert a dotted content path is a non-empty string in the given locales only. */
  const requireStringIn = (paths: string[], locs: string[]) => {
    for (const locale of locs) {
      const content = loadContent(locale);
      for (const p of paths) {
        const v = get(content, p);
        expect(typeof v, `${locale}/${p} missing or non-string`).toBe("string");
        expect((v as string).length, `${locale}/${p} empty`).toBeGreaterThan(0);
      }
    }
  };

  it("oscilloscope: every fault label/desc, exercise prose, AI hint, step + verdict (EN/AR/FR)", () => {
    const paths: string[] = ["oscilloscope.verdict.correct", "oscilloscope.verdict.wrong"];
    for (const f of OSC_FAULT_IDS) paths.push(`oscilloscope.fault.${f}.label`, `oscilloscope.fault.${f}.desc`);
    for (const e of SCOPE_EXERCISES) {
      paths.push(`oscilloscope.ex.${e.id}.sub`, `oscilloscope.ex.${e.id}.instruction`, `oscilloscope.ex.${e.id}.function`);
      paths.push(`oscilloscope.ex.${e.id}.anim1`, `oscilloscope.ex.${e.id}.anim2`, `oscilloscope.ex.${e.id}.animEvent`);
      for (let i = 0; i < 4; i++) paths.push(`oscilloscope.ex.${e.id}.bullets.${i}`);
      for (let i = 0; i < 3; i++) paths.push(`oscilloscope.ex.${e.id}.probeNotes.${i}`);
    }
    for (const k of ["supply", "ground", "none", "spec"]) paths.push(`oscilloscope.ai.${k}`);
    for (const k of ["probe", "vdiv", "timebase", "trigger", "capture", "cursors", "diagnosis"]) paths.push(`oscilloscope.step.${k}`);
    requireString(paths); // all three locales — no fallback
  });

  it("scanner DTC: every cause id + overview/repair has content prose", () => {
    const paths: string[] = [];
    for (const [code, detail] of Object.entries(DTC_DETAIL)) {
      paths.push(`dtc.${code}.overview`, `dtc.${code}.repair`);
      for (const cause of detail.causes) paths.push(`dtc.${code}.cause.${cause.id}`);
    }
    requireString(paths);
  });

  it("scanner tree: every step id has label + hint, plus feedback + verdict", () => {
    const paths = TREE.flatMap((s) => [`scanner.tree.${s.id}.label`, `scanner.tree.${s.id}.hint`]);
    paths.push("scanner.tree.verdict");
    paths.push("scanner.treeFeedback.recheck", "scanner.treeFeedback.correct", "scanner.treeFeedback.confirmed");
    requireString(paths);
  });

  it("scanner ADAS: every item name/note + preconditions + status prose", () => {
    const paths = ["scanner.adas.calibType.static", "scanner.adas.status.idle", "scanner.adas.status.success"];
    for (const it of ADAS_ITEMS) paths.push(`scanner.adas.item.${it.id}.name`, `scanner.adas.item.${it.id}.note`);
    for (let i = 0; i < ADAS_ACTIVE.preconditionCount; i++) paths.push(`scanner.adas.precondition.${i}`);
    requireString(paths);
  });

  it("scanner training: every step/answer id + result + verdict has prose", () => {
    const paths = TRAINING_STEPS.flatMap((s) => [`scanner.training.step.${s.id}.label`, `scanner.training.step.${s.id}.detail`]);
    paths.push(...TRAINING_ANSWERS.map((id) => `scanner.training.answer.${id}`));
    paths.push("scanner.training.result.correct", "scanner.training.result.wrong");
    paths.push("scanner.training.verdict.correct", "scanner.training.verdict.wrong");
    requireString(paths);
  });

  it("scanner assistant: seed + every turn's reply options and response have prose", () => {
    const paths = ["scanner.assist.seed"];
    ASSISTANT_TURNS.forEach((turn) => {
      for (const opt of turn.opts) paths.push(`scanner.assist.${opt}`);
      paths.push(`scanner.assist.${turn.reply}`);
    });
    requireString(paths);
  });

  it("multimeter: every complaint, step instruction/fail/question, verdict + feedback localized (EN/AR/FR)", () => {
    const paths: string[] = [
      "multimeter.verdict.clear",
      "multimeter.verdict.found",
      "multimeter.feedback.takeMeasurement",
      "multimeter.feedback.wrongYes",
      "multimeter.feedback.wrongNo",
    ];
    for (const c of MM_PROCEDURES) {
      paths.push(`multimeter.${c.ref}.complaint`);
      c.steps.forEach((s, i) => {
        paths.push(`multimeter.${c.ref}.step.${i}.instruction`, `multimeter.${c.ref}.step.${i}.fail`);
        if (s.table) paths.push(`multimeter.${c.ref}.step.${i}.question`);
      });
    }
    requireString(paths); // all three locales — no fallback, no missing keys
  });

  it("location: every sensor/actuator has location + mount prose, plus verdict/training/quiz (EN/AR/FR)", () => {
    const proseKeys = LOC_COMPONENTS.filter((c) => c.kind === "sensor").map((c) => c.key); // 10 sensors + actuators
    const paths: string[] = [];
    for (const k of proseKeys) paths.push(`location.${k}.location`, `location.${k}.mount`);
    paths.push(
      "location.verdict.training.pass", "location.verdict.training.retry",
      "location.verdict.quiz.pass", "location.verdict.quiz.retry",
      "location.train.prompt", "location.train.instruction", "location.train.correct", "location.train.wrong",
      "location.quiz.prompt", "location.quiz.instruction", "location.quiz.wrong",
    );
    for (const d of ["Easy", "Medium", "Hard", "Expert"]) paths.push(`location.difficulty.${d}`);
    requireString(paths); // all three locales — no fallback
  });

  it("schematic: every trace/task/exam id + practice/feedback/hud/verdict/na/empty (EN/AR/FR)", () => {
    const paths: string[] = [];
    // the actual ids referenced by the engine/data layer
    for (const tr of SCH_TRACES) {
      paths.push(tr.labelId);
      for (const s of tr.steps) paths.push(s.descId);
    }
    for (const t of SCH_TASKS) paths.push(t.promptId, t.explainId);
    for (const q of SCH_EXAM) paths.push(q.promptId);
    paths.push(
      "schematic.practice.prompt",
      "schematic.feedback.correct", "schematic.feedback.wrong", "schematic.feedback.practiceCorrect", "schematic.feedback.practiceWrong", "schematic.feedback.traceWrong", "schematic.feedback.examRecorded",
      "schematic.hud.trace", "schematic.hud.examProgress", "schematic.hud.examDone", "schematic.hud.hover",
      "schematic.verdict.training.pass", "schematic.verdict.training.retry",
      "schematic.verdict.practice.pass", "schematic.verdict.practice.retry",
      "schematic.verdict.exam.pass", "schematic.verdict.exam.retry",
      "schematic.na.field", "schematic.na.wire", "schematic.na.connector", "schematic.na.vehicle", "schematic.na.systems", "schematic.na.pins", "schematic.na.search", "schematic.na.recent",
      "schematic.empty.title", "schematic.empty.body",
    );
    requireString(paths); // all three locales — no fallback
  });

  it("seeded reports: every finding/verdict/step resolves via content (EN/AR/FR)", () => {
    const paths: string[] = [];
    for (const r of REPORTS) {
      paths.push(unsentinel(r.finding), unsentinel(r.verdict));
      for (const s of r.steps) paths.push(unsentinel(s.label));
    }
    requireString(paths);
  });

  it("progress: cert names / weak-spot / path labels / coach resolve via content (EN/AR/FR)", () => {
    const paths = [
      ...PROGRESS.certifications.map((c) => c.name),
      ...PROGRESS.weakSpots.map((w) => w.label),
      ...PROGRESS.recommendedPath.map((p) => p.label),
      PROGRESS.coach,
    ];
    requireString(paths);
  });

  it("hub: every module subtitle/features/lastActivity + task title/meta + coach", () => {
    const paths: string[] = [];
    for (const m of MODS) paths.push(`hub.mod.${m.id}.subtitle`, `hub.mod.${m.id}.features`, `hub.mod.${m.id}.lastActivity`);
    HUB_TASKS.forEach((_task, i) => paths.push(`hub.task.${i}.title`, `hub.task.${i}.meta`));
    paths.push("hub.coach");
    requireString(paths);
  });

  it("scanner training simulator: scenario, objectives, instructor note, library titles", () => {
    const paths = ["scanner.training.scenario.title", "scanner.training.scenario.desc", "scanner.training.instructorNote"];
    for (let i = 0; i < ACTIVE_SCENARIO.objectiveCount; i++) paths.push(`scanner.training.obj.${i}`);
    for (const s of SCENARIO_LIBRARY) paths.push(`scanner.training.lib.${s.n}`);
    requireString(paths);
  });

  it("scanner workstation (SC-01/02): header, heroes, modules, meta, recent, status", () => {
    const paths: string[] = ["scanner.ws.header.kicker", "scanner.ws.header.heading"];
    for (const h of HERO_PANELS) paths.push(`scanner.ws.hero.${h.id}.title`, `scanner.ws.hero.${h.id}.desc`, `scanner.ws.hero.${h.badgeId}`);
    for (const m of FUNCTION_MODULES) paths.push(`scanner.ws.mod.${m.id}.title`, `scanner.ws.mod.${m.id}.subtitle`);
    for (const m of META_CARDS) paths.push(`scanner.ws.meta.${m.id}`);
    paths.push("scanner.ws.recent.title", "scanner.ws.recent.viewAll", "scanner.ws.recent.dtc");
    paths.push("scanner.ws.status.connected", "scanner.ws.status.coverage", "scanner.ws.status.start");
    requireString(paths);
  });

  it("scanner report: customer complaint + every measurement label has prose", () => {
    const paths = ["scanner.report.customerComplaint"];
    for (const m of REPORT_MEASUREMENTS) paths.push(`scanner.report.measurement.${m.id}`);
    requireString(paths);
  });

  it("data layer carries no learner-facing prose (ids only)", () => {
    // DTC causes: id, not text
    for (const detail of Object.values(DTC_DETAIL)) {
      for (const cause of detail.causes) {
        expect(cause).toHaveProperty("id");
        expect(cause).not.toHaveProperty("text");
      }
    }
    // Tree/training steps: id, not label/hint/detail
    for (const s of TREE) {
      expect(s).toHaveProperty("id");
      expect(s).not.toHaveProperty("label");
      expect(s).not.toHaveProperty("hint");
    }
    for (const s of TRAINING_STEPS) {
      expect(s).toHaveProperty("id");
      expect(s).not.toHaveProperty("label");
      expect(s).not.toHaveProperty("detail");
    }
    // Multimeter steps: no instruction/fail/complaint prose in data
    for (const c of MM_PROCEDURES) {
      expect(c).not.toHaveProperty("complaint");
      for (const step of c.steps) {
        expect(step).not.toHaveProperty("instruction");
        expect(step).not.toHaveProperty("fail");
      }
    }
    // Location components: no location/mount/notes prose in data
    for (const h of LOC_COMPONENTS) {
      expect(h).not.toHaveProperty("location");
      expect(h).not.toHaveProperty("mount");
      expect(h).not.toHaveProperty("notes");
    }
    // Hub modules/tasks: no subtitle/features/lastActivity/title/meta prose in data
    for (const m of MODS) {
      expect(m).not.toHaveProperty("subtitle");
      expect(m).not.toHaveProperty("features");
      expect(m).not.toHaveProperty("lastActivity");
    }
    for (const task of HUB_TASKS) {
      expect(task).not.toHaveProperty("title");
      expect(task).not.toHaveProperty("meta");
    }
  });
});
