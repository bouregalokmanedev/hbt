import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

const { mentorApiMock } = vi.hoisted(() => ({
    mentorApiMock: {
        list: vi.fn(),
        create: vi.fn(),
        get: vi.fn(),
        archive: vi.fn(),
        feedback: vi.fn(),
        voltageDrop: vi.fn(),
        checklist: vi.fn(),
        practiceQuiz: vi.fn(),
    },
}));

vi.mock("@/features/ai-mentor/api/mentor-api", () => ({
    mentorApi: mentorApiMock,
    streamMentorMessage: vi.fn(),
}));

import { MentorPopup } from "./MentorPopup";
import type { MentorConversation } from "@/features/ai-mentor/types/mentor";

function conversation(): MentorConversation {
    return {
        id: "c1",
        title: "AI mentor",
        course_id: null,
        lesson_id: null,
        status: "active",
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
    };
}

function renderPopup(
    props: Partial<{ open: boolean; initialPrompt: string; onClose: () => void }> = {},
) {
    const onClose = props.onClose ?? vi.fn();
    render(
        <I18nextProvider i18n={i18n}>
            <MentorPopup open initialPrompt="" onClose={onClose} {...props} />
        </I18nextProvider>,
    );
    return { onClose };
}

beforeEach(() => {
    vi.clearAllMocks();
    mentorApiMock.create.mockResolvedValue(conversation());
    mentorApiMock.get.mockResolvedValue(conversation());
    mentorApiMock.list.mockResolvedValue([]);
});

describe("MentorPopup", () => {
    it("renders nothing while closed", () => {
        renderPopup({ open: false });
        expect(screen.queryByTestId("mentor-popup")).toBeNull();
    });

    it("opens as a dialog with the prompt prefilled", async () => {
        renderPopup({
            initialPrompt: "Explain fault code P0301 on the engine ECU.",
        });

        expect(await screen.findByTestId("mentor-popup")).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
            screen.getByDisplayValue("Explain fault code P0301 on the engine ECU."),
        ).toBeInTheDocument();

        await waitFor(() => expect(mentorApiMock.get).toHaveBeenCalled());
    });

    it("closes from the close button, backdrop click and Escape", async () => {
        const { onClose } = renderPopup();

        await screen.findByTestId("mentor-popup");
        fireEvent.click(screen.getByTestId("mentor-popup-close"));
        expect(onClose).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId("mentor-popup"));
        expect(onClose).toHaveBeenCalledTimes(2);

        fireEvent.keyDown(window, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(3);

        await waitFor(() => expect(mentorApiMock.get).toHaveBeenCalled());
    });
});
