import { create } from "zustand";

type MentorMessage = { role: "user" | "assistant"; content: string };

type State = {
    isOpen: boolean;
    messages: MentorMessage[];
    input: string;
    isSending: boolean;
};

type Actions = {
    setOpen(v: boolean): void;
    setInput(v: string): void;
    pushMessage(m: MentorMessage): void;
    setSending(v: boolean): void;
    reset(): void;
};

export const useDiagnosticMentorStore = create<State & Actions>((set) => ({
    isOpen: false,
    messages: [],
    input: "",
    isSending: false,
    setOpen: (isOpen) => set({ isOpen }),
    setInput: (input) => set({ input }),
    pushMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
    setSending: (isSending) => set({ isSending }),
    reset: () => set({ messages: [], input: "", isSending: false }),
}));
