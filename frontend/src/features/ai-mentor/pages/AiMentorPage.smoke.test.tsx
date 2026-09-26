import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { AiMentorPage } from "./AiMentorPage";
import { mentorApi } from "../api/mentor-api";
import type { MentorConversation } from "../types/mentor";

vi.mock("../api/mentor-api", () => ({
    mentorApi: {
        list: vi.fn(),
        create: vi.fn(),
        get: vi.fn(),
        archive: vi.fn(),
        feedback: vi.fn(),
        voltageDrop: vi.fn(),
        checklist: vi.fn(),
        practiceQuiz: vi.fn(),
    },
    streamMentorMessage: vi.fn(),
}));

function conversation(overrides: Partial<MentorConversation> = {}): MentorConversation {
    return {
        id: "c1",
        title: "Wiring basics",
        course_id: null,
        lesson_id: null,
        status: "active",
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
        ...overrides,
    };
}

function createConversation(id: string): MentorConversation {
    return conversation({ id, title: "AI learning session" });
}

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <AiMentorPage />
        </I18nextProvider>,
    );
}

describe("AiMentorPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mentorApi.list).mockResolvedValue([conversation()]);
        vi.mocked(mentorApi.get).mockImplementation(async (id) => conversation({ id }));
        vi.mocked(mentorApi.create).mockImplementation(async () => {
            const callIndex = vi.mocked(mentorApi.create).mock.calls.length;
            return createConversation(`created-${callIndex}`);
        });
        vi.mocked(mentorApi.archive).mockResolvedValue(undefined);
    });

    it("replaces diagnostic utilities with history, skills, and tabs", async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId("mentor-history-item")).toBeInTheDocument();
        });

        expect(screen.queryByText(/Diagnostic utilities/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Prompts to try/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Chat history/i)).toBeInTheDocument();
        expect(screen.getByText(/How your mentor helps/i)).toBeInTheDocument();
        expect(screen.getAllByTestId("mentor-skill")).toHaveLength(4);
        expect(screen.getByText(/Mentor promise/i)).toBeInTheDocument();
        expect(screen.getByTestId("mentor-new-chat")).toBeInTheDocument();
        expect(screen.getAllByTestId("mentor-tab")).toHaveLength(1);
    });

    it("allows at most three open chat tabs", async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId("mentor-new-chat")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("mentor-new-chat"));
        await waitFor(() => {
            expect(screen.getAllByTestId("mentor-tab")).toHaveLength(2);
        });

        fireEvent.click(screen.getByTestId("mentor-new-chat"));
        await waitFor(() => {
            expect(screen.getAllByTestId("mentor-tab")).toHaveLength(3);
        });

        expect(screen.getByTestId("mentor-tab-limit")).toBeInTheDocument();
        expect(screen.getByTestId("mentor-new-chat")).toBeDisabled();
        expect(screen.getAllByTestId("mentor-tab")).toHaveLength(3);
    });

    it("fills the active composer when an empty-state prompt is tapped", async () => {
        renderPage();

        const prompts = await screen.findAllByTestId("mentor-empty-prompt");
        const prompt = prompts[0];
        const promptText = prompt.textContent ?? "";

        fireEvent.click(prompt);

        await waitFor(() => {
            expect(screen.getByTestId("mentor-composer")).toHaveValue(promptText);
        });
    });

    it("opens a history chat in a new tab and focuses it when already closed", async () => {
        vi.mocked(mentorApi.list).mockResolvedValue([
            conversation({ id: "h1", title: "Wiring basics" }),
            conversation({ id: "h2", title: "Sensor lab" }),
        ]);
        vi.mocked(mentorApi.get).mockImplementation(async (id) => conversation({ id, title: id === "h2" ? "Sensor lab" : "Wiring basics" }));

        renderPage();

        await waitFor(() => {
            expect(screen.getAllByTestId("mentor-history-item")).toHaveLength(2);
        });

        const items = screen.getAllByTestId("mentor-history-item");
        fireEvent.click(items[1]);

        await waitFor(() => {
            expect(screen.getAllByTestId("mentor-tab")).toHaveLength(2);
        });
        expect(screen.getAllByText("Sensor lab").length).toBeGreaterThan(0);
    });

    it("archives a conversation and removes it from history", async () => {
        renderPage();

        const archive = await screen.findByTestId("mentor-history-archive");
        fireEvent.click(archive);

        await waitFor(() => {
            expect(mentorApi.archive).toHaveBeenCalledWith("c1");
        });
        await waitFor(() => {
            expect(screen.getByTestId("mentor-history-empty")).toBeInTheDocument();
        });
    });
});
