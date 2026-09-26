import { z } from "zod";
import { Module } from "../schema";

/** The 5 tool modules (MODS) shown on the hub and rail (01/06). */
export const MODS: Module[] = [
  {
    id: "scanner",
    index: 1,
    tag: "SCN",
    name: "Scanner",
    title: "Diagnostic scanner",
    desc: "21-ECU network, live PIDs, fault codes and guided diagnostic trees.",
    skill: "Fault-code diagnosis",
    progress: 72,
    accent: "#F47822",
    accentBg: "#FFF1E4",
  },
  {
    id: "multimeter",
    index: 2,
    tag: "DMM",
    name: "Multimeter",
    title: "Guided static measurement",
    desc: "Bench replica DMM with probe placement across 12 components.",
    skill: "Circuit measurement",
    progress: 45,
    accent: "#1F6AE1",
    accentBg: "#EAF1FE",
  },
  {
    id: "oscilloscope",
    index: 3,
    tag: "OSC",
    name: "Oscilloscope",
    title: "Waveform laboratory",
    desc: "Dual-channel scope with real waveform synthesis and fault injection.",
    skill: "Waveform analysis",
    progress: 61,
    accent: "#8B5CF6",
    accentBg: "#F2EDFE",
  },
  {
    id: "location",
    index: 4,
    tag: "LOC",
    name: "Location",
    title: "Component-location atlas",
    desc: "Find sensors, ECUs and grounds; train and quiz on placement.",
    skill: "Component location",
    progress: 88,
    accent: "#0E9F6E",
    accentBg: "#E7F7F0",
  },
  {
    id: "schematic",
    index: 5,
    tag: "WDG",
    name: "Schematic",
    title: "Wiring-diagram workspace",
    desc: "Trace the real harness netlist across ~55 components and ~140 wires.",
    skill: "Circuit tracing",
    progress: 24,
    accent: "#D92D20",
    accentBg: "#FDECEA",
  },
];

export const MODSSchema = z.array(Module);
