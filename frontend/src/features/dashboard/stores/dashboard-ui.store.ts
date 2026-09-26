import { create } from "zustand";

interface DashboardUiState {
  customizing: boolean;
  setCustomizing: (value: boolean) => void;
  toggleCustomizing: () => void;
}

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  customizing: false,
  setCustomizing: (value) => set({ customizing: value }),
  toggleCustomizing: () =>
    set((state) => ({ customizing: !state.customizing })),
}));
