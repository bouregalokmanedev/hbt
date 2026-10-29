import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LessonContent } from "./LessonContent";

const media = [
    {
        id: "m1",
        url: "https://api.example.test/media/m1",
        original_name: "wiring-diagram.png",
        type: "image",
        mime_type: "image/png",
    },
    {
        id: "m2",
        url: "https://api.example.test/media/m2",
        original_name: "diagnostic-checklist.pdf",
        type: "document",
        mime_type: "application/pdf",
    },
];

describe("LessonContent", () => {
    it("resolves image media references to the signed URL from the lesson", () => {
        const { container } = render(
            <LessonContent
                html='<p>Inspect the circuit.</p><img data-media-id="m1" alt="">'
                media={media}
            />,
        );

        const image = container.querySelector("img");
        expect(image).toHaveAttribute("src", "https://api.example.test/media/m1");
        expect(image).toHaveAttribute("alt", "wiring-diagram.png");
    });

    it("resolves document media references and opens them safely", () => {
        const { container } = render(
            <LessonContent
                html='<p>Use the <a href="#" data-media-id="m2">checklist</a>.</p>'
                media={media}
            />,
        );

        const link = container.querySelector("a");
        expect(link).toHaveAttribute("href", "https://api.example.test/media/m2");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("removes references to media that is no longer attached", () => {
        const { container } = render(
            <LessonContent
                html='<p>Before</p><img data-media-id="gone" alt="Removed"><p>After</p>'
                media={media}
            />,
        );

        expect(container.querySelector("img")).toBeNull();
        expect(container).toHaveTextContent("Before");
        expect(container).toHaveTextContent("After");
    });

    it("still strips scripts and unsafe attributes", () => {
        const { container } = render(
            <LessonContent
                html='<p onclick="alert(1)">Safe</p><script>alert(1)</script>'
                media={media}
            />,
        );

        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector("p")).not.toHaveAttribute("onclick");
        expect(container).toHaveTextContent("Safe");
    });
});
