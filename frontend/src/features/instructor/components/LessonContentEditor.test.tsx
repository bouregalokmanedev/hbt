import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import i18n from "@/i18n";
import type { InstructorLessonMedia } from "../types/instructor";
import { LessonContentEditor } from "./LessonContentEditor";

function Harness({
    initial = "",
    media = [],
}: {
    initial?: string;
    media?: InstructorLessonMedia[];
}) {
    const [value, setValue] = useState(initial);

    return (
        <I18nextProvider i18n={i18n}>
            <LessonContentEditor value={value} onChange={setValue} media={media} />
            <output data-testid="editor-value">{value}</output>
        </I18nextProvider>
    );
}

const imageMedia: InstructorLessonMedia = {
    id: "m1",
    original_name: "wiring-diagram.png",
    mime_type: "image/png",
    size: 2048,
    type: "image",
    url: "https://api.example.test/media/m1",
};

const documentMedia: InstructorLessonMedia = {
    id: "m2",
    original_name: "diagnostic-checklist.pdf",
    mime_type: "application/pdf",
    size: 4096,
    type: "document",
    url: "https://api.example.test/media/m2",
};

describe("LessonContentEditor", () => {
    it("wraps the selected text with strong tags from the toolbar", () => {
        render(<Harness initial="Engine" />);

        const textarea = screen.getByTestId("lesson-content-write") as HTMLTextAreaElement;
        textarea.setSelectionRange(0, "Engine".length);
        fireEvent.click(screen.getByTestId("lesson-toolbar-bold"));

        expect(screen.getByTestId("editor-value")).toHaveTextContent(
            "<strong>Engine</strong>",
        );
    });

    it("counts words from the authored HTML", () => {
        render(<Harness initial="<p>one two three</p>" />);

        expect(screen.getByTestId("lesson-content-stats")).toHaveTextContent("3 words");
    });

    it("previews sanitized HTML and removes script content", () => {
        render(
            <Harness initial="<h2>Brakes</h2><script>alert(1)</script><p>Check <strong>pads</strong>.</p>" />,
        );

        fireEvent.click(screen.getByTestId("lesson-editor-tab-preview"));

        const preview = screen.getByTestId("lesson-content-preview");
        expect(within(preview).getByRole("heading", { name: "Brakes" })).toBeInTheDocument();
        expect(preview).toHaveTextContent("Check pads.");
        expect(within(preview).queryByText("alert(1)")).not.toBeInTheDocument();
        expect(preview.querySelector("script")).toBeNull();
    });

    it("shows an empty state when previewing untouched content", () => {
        render(<Harness />);

        fireEvent.click(screen.getByTestId("lesson-editor-tab-preview"));

        expect(
            within(screen.getByTestId("lesson-content-preview")).getByText(
                "Nothing to preview yet — start writing your lesson.",
            ),
        ).toBeInTheDocument();
    });

    it("inserts a safe absolute link", () => {
        render(<Harness initial="Read the guide" />);

        const textarea = screen.getByTestId("lesson-content-write") as HTMLTextAreaElement;
        textarea.setSelectionRange(0, "Read the guide".length);
        fireEvent.click(screen.getByTestId("lesson-toolbar-link"));

        fireEvent.change(screen.getByLabelText("Link URL"), {
            target: { value: "example.com/guide" },
        });
        fireEvent.change(screen.getByLabelText("Link text"), {
            target: { value: "Read the guide" },
        });
        fireEvent.click(screen.getByTestId("lesson-link-insert"));

        expect(screen.getByTestId("editor-value")).toHaveTextContent(
            '<a href="https://example.com/guide">Read the guide</a>',
        );
    });

    it("blocks javascript: links", () => {
        render(<Harness initial="Unsafe" />);

        fireEvent.click(screen.getByTestId("lesson-toolbar-link"));
        fireEvent.change(screen.getByLabelText("Link URL"), {
            target: { value: "javascript:alert(1)" },
        });
        fireEvent.click(screen.getByTestId("lesson-link-insert"));

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Enter a valid link that does not use javascript, data, or vbscript.",
        );
        expect(screen.getByTestId("editor-value")).toHaveTextContent("Unsafe");
        expect(screen.getByTestId("editor-value")).not.toHaveTextContent("<a ");
    });

    it("inserts uploaded image media and previews its fresh URL", () => {
        render(<Harness initial="Diagram:" media={[imageMedia]} />);

        const textarea = screen.getByTestId("lesson-content-write") as HTMLTextAreaElement;
        textarea.setSelectionRange("Diagram:".length, "Diagram:".length);
        fireEvent.click(screen.getByTestId("lesson-toolbar-media"));
        fireEvent.click(screen.getByTestId("lesson-media-option-m1"));

        expect(screen.getByTestId("editor-value")).toHaveTextContent(
            '<img data-media-id="m1" alt="wiring-diagram.png">',
        );

        fireEvent.click(screen.getByTestId("lesson-editor-tab-preview"));
        const image = screen.getByTestId("lesson-content-preview").querySelector("img");
        expect(image).toHaveAttribute("src", "https://api.example.test/media/m1");
        expect(image).toHaveAttribute("alt", "wiring-diagram.png");
    });

    it("inserts uploaded documents as secure media links", () => {
        render(<Harness initial="Checklist:" media={[documentMedia]} />);

        const textarea = screen.getByTestId("lesson-content-write") as HTMLTextAreaElement;
        textarea.setSelectionRange("Checklist:".length, "Checklist:".length);
        fireEvent.click(screen.getByTestId("lesson-toolbar-media"));
        fireEvent.click(screen.getByTestId("lesson-media-option-m2"));

        expect(screen.getByTestId("editor-value")).toHaveTextContent(
            '<a href="#" data-media-id="m2">diagnostic-checklist.pdf</a>',
        );
    });

    it("explains how to add media when none is uploaded", () => {
        render(<Harness />);

        fireEvent.click(screen.getByTestId("lesson-toolbar-media"));

        expect(screen.getByTestId("lesson-media-picker")).toHaveTextContent(
            "No images or documents yet. Upload one in Lesson media below.",
        );
    });
});
