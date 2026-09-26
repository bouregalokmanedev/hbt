import { z } from "zod";
import { ComponentRef } from "../schema";

/**
 * Shared components under test (CTX, 11) — the join key across all tools (06 §0).
 * Names are Class-B canonical technical data (never translated, 14 §0).
 */
export const CTX: ComponentRef[] = [
  { ref: "X1", name: "Crankshaft position sensor", system: "Ignition / position", loc: "X1", mm: "X1", scope: null, sch: "X1" },
  { ref: "X7", name: "Camshaft position (inlet)", system: "Valve timing", loc: "X7", mm: "X7", scope: "cam", sch: "X7" },
  { ref: "L3", name: "Mass air flow sensor", system: "Air & fuel", loc: "L3", mm: "L3", scope: null, sch: "L3" },
  { ref: "L1", name: "Manifold absolute pressure", system: "Air & fuel", loc: "L1", mm: "L1", scope: "map", sch: "L1" },
  { ref: "H3", name: "Throttle actuator motor", system: "Air & fuel", loc: "H3", mm: "H3", scope: null, sch: "H3" },
  { ref: "I2", name: "Knock sensor", system: "Ignition", loc: "I2", mm: "I2", scope: "knock", sch: "I2" },
  { ref: "T1", name: "Engine coolant temperature", system: "Temperature", loc: "T1", mm: "T1", scope: null, sch: "T1" },
  { ref: "U2", name: "Oxygen sensor (post-cat)", system: "Emissions", loc: "U2", mm: "U1", scope: "lambda", sch: "U2" },
  { ref: "G1", name: "Accelerator pedal sensor", system: "Driver demand", loc: "G1", mm: "G1", scope: "app", sch: "G1" },
  { ref: "INJ", name: "Fuel injector 1", system: "Fuel delivery", loc: null, mm: "A1", scope: "inj", sch: "INJ1" },
  { ref: "COIL", name: "Ignition coil 1", system: "Ignition", loc: null, mm: "I1", scope: "coil", sch: "COIL1" },
];

export const CTXSchema = z.array(ComponentRef);

export function componentByRef(ref: string): ComponentRef | undefined {
  return CTX.find((c) => c.ref === ref);
}

/** Whether a component has data available in a given tool (03 has()). */
export function hasTool(ref: string, tool: "loc" | "mm" | "scope" | "sch"): boolean {
  const c = componentByRef(ref);
  return !!c && c[tool] != null;
}
