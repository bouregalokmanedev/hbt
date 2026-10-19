import { create } from "zustand";

/**
 * One source of truth for the floating help panel. The launcher normally
 * lives in `HelpWidget`, but surfaces that ship their own quick-action
 * cluster (the lesson player) open the same panel from their own button.
 */
interface HelpState {
    open: boolean;
    openPanel: () => void;
    closePanel: () => void;
    togglePanel: () => void;
}

export const useHelpStore = create<HelpState>((set) => ({
    open: false,
    openPanel: () => set({ open: true }),
    closePanel: () => set({ open: false }),
    togglePanel: () => set((state) => ({ open: !state.open })),
}));
