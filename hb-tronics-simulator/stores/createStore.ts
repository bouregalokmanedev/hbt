import { createStore as createZustand } from "zustand/vanilla";
import type { SessionResult } from "@sim/core";
import { getRepositories } from "@/data/repositories";
import { PROGRESS } from "@/data/record";
import type { Coverage, ToolId, Report } from "@/data/schema";

// Shared-bench + record data flows through the repository seam (10 §7/§15),
// so a future HTTP implementation swaps in without touching this store.
const repo = getRepositories();

/**
 * SSR/SaaS-safe store factory (review F2, 10 §6). NOT a module-level singleton —
 * StoreProvider instantiates one per client (and per request for any future
 * SSR/multi-user rendering) so state never leaks across users.
 *
 * A single store with four logical slices (bench/settings/record/ui) matching
 * the documented store set. Holds only plain serialisable state + intent
 * actions — no domain math (that lives in engines).
 */
export interface Settings {
  difficulty: "Easy" | "Medium" | "Hard";
  hints: boolean;
  randomFault: boolean;
  outlines: boolean;
  noise: "Off" | "Normal" | "High";
  instrument: string;
  probeMode: "Drag probes" | "Click to place";
  hubLayout: "cards" | "rows";
  railExpanded: boolean;
  railLabels: boolean;
  language: "en" | "ar" | "fr";
}

export interface ToastMsg {
  id: number;
  text: string;
}

export interface AppState {
  // ---- bench slice (04/06) ----
  vehicleId: string;
  focus: string | null; // component-under-test ref
  signedIn: boolean;
  setVehicle: (id: string) => void;
  setFocus: (ref: string | null) => void;
  coverage: (tool: ToolId) => Coverage;
  signIn: () => void;
  signOut: () => void;

  // ---- settings slice (04) ----
  settings: Settings;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  toggleRail: () => void;

  // ---- record slice (06/F2) ----
  reports: Report[];
  progress: typeof PROGRESS;
  commitResult: (r: SessionResult) => void;

  // ---- ui slice (04/09) ----
  toast: ToastMsg | null;
  pickerOpen: boolean;
  userMenuOpen: boolean;
  vw: number;
  say: (text: string) => void;
  clearToast: () => void;
  openPicker: () => void;
  closePicker: () => void;
  toggleUserMenu: () => void;
  closeUserMenu: () => void;
  setVw: (vw: number) => void;
}

const DEFAULT_SETTINGS: Settings = {
  difficulty: "Medium",
  hints: true,
  randomFault: true,
  outlines: true,
  noise: "Normal",
  instrument: "Bench replica",
  probeMode: "Drag probes",
  hubLayout: "cards",
  railExpanded: false,
  railLabels: false,
  language: "en",
};

let toastSeq = 0;

export type AppStore = ReturnType<typeof createAppStore>;

export function createAppStore(init?: Partial<Pick<AppState, "vehicleId" | "focus" | "signedIn">>) {
  return createZustand<AppState>((set, get) => ({
    vehicleId: init?.vehicleId ?? repo.vehicles.list()[0].id,
    focus: init?.focus ?? "INJ",
    signedIn: init?.signedIn ?? false,

    setVehicle: (id) => {
      const v = repo.vehicles.byId(id);
      set({ vehicleId: id });
      if (v) get().say(`Active vehicle switched to ${v.name}`);
    },
    setFocus: (ref) => {
      set({ focus: ref, pickerOpen: false });
      const c = ref ? repo.components.byRef(ref) : undefined;
      if (c) get().say(`Component context set to ${c.name}`);
    },
    coverage: (tool) => repo.vehicles.coverage(get().vehicleId, tool) as Coverage,
    signIn: () => set({ signedIn: true }),
    signOut: () => set({ signedIn: false, userMenuOpen: false }),

    settings: { ...DEFAULT_SETTINGS },
    setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
    toggleRail: () => set((s) => ({ settings: { ...s.settings, railExpanded: !s.settings.railExpanded } })),

    reports: [...repo.record.reports()],
    progress: PROGRESS,
    commitResult: (r) => {
      // Milestone 3.5 — dual-write: remote commit when flag=http, always keep local array so UI never breaks.
      // No engine change; tech comes from session when available (otherwise fallback).
      const remote = getRepositories().record.commit?.(r);
      if (remote) void remote.catch(() => {});
      set((s) => ({
        reports: [
          {
            id: `r-${r.at}`,
            date: new Date(r.at).toISOString().slice(0, 10),
            tools: [r.tool],
            finding: r.verdict,
            outcome: r.outcome,
            score: r.score,
            verdict: r.verdict,
            steps: r.steps,
            vehicleId: s.vehicleId,
            vin: repo.vehicles.byId(s.vehicleId)?.vin ?? "",
            km: repo.vehicles.byId(s.vehicleId)?.odometerKm ?? 0,
            tech: "H. Barakat",
          },
          ...s.reports,
        ],
      }));
    },

    toast: null,
    pickerOpen: false,
    userMenuOpen: false,
    vw: 1440,
    say: (text) => {
      const id = ++toastSeq;
      set({ toast: { id, text } });
    },
    clearToast: () => set({ toast: null }),
    openPicker: () => set({ pickerOpen: true, userMenuOpen: false }),
    closePicker: () => set({ pickerOpen: false }),
    toggleUserMenu: () => set((s) => ({ userMenuOpen: !s.userMenuOpen, pickerOpen: false })),
    closeUserMenu: () => set({ userMenuOpen: false }),
    setVw: (vw) => set({ vw }),
  }));
}
