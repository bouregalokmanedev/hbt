import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { Bootcamp } from "../types/bootcamp.types";

vi.mock("../hooks/useInstructorBootcamps", () => ({
  useInstructorBootcamp: vi.fn(),
  useBootcampRegistrations: vi.fn(),
}));

vi.mock("../api/instructorBootcampsApi", () => ({
  createInstructorBootcamp: vi.fn(),
  createInstructorBootcampSchedule: vi.fn(),
  deleteInstructorBootcamp: vi.fn(),
  deleteInstructorBootcampSchedule: vi.fn(),
  removeInstructorBootcampMedia: vi.fn(),
  runInstructorBootcampAction: vi.fn(),
  syncInstructorBootcampCurriculum: vi.fn(),
  updateBootcampRegistrationStatus: vi.fn(),
  updateInstructorBootcamp: vi.fn(),
  updateInstructorBootcampSchedule: vi.fn(),
  uploadInstructorBootcampBrochure: vi.fn(),
  uploadInstructorBootcampMedia: vi.fn(),
}));

import {
  createInstructorBootcampSchedule,
  removeInstructorBootcampMedia,
  syncInstructorBootcampCurriculum,
  updateInstructorBootcamp,
  uploadInstructorBootcampMedia,
} from "../api/instructorBootcampsApi";
import {
  useBootcampRegistrations,
  useInstructorBootcamp,
} from "../hooks/useInstructorBootcamps";
import { InstructorBootcampEditorPage } from "./InstructorBootcampEditorPage";

const mockedBootcampQuery = vi.mocked(useInstructorBootcamp);
const mockedRegistrationsQuery = vi.mocked(useBootcampRegistrations);
const mockedUpdate = vi.mocked(updateInstructorBootcamp);
const mockedSync = vi.mocked(syncInstructorBootcampCurriculum);
const mockedCreateSchedule = vi.mocked(createInstructorBootcampSchedule);
const mockedUploadMedia = vi.mocked(uploadInstructorBootcampMedia);
const mockedRemoveMedia = vi.mocked(removeInstructorBootcampMedia);

function makeBootcamp(overrides: Partial<Bootcamp> = {}): Bootcamp {
  return {
    id: "ev-hybrid",
    title: "EV & Hybrid Systems",
    slug: "ev-hybrid-systems",
    short_description: "High-voltage safety and battery diagnosis.",
    description: "A hands-on bootcamp.",
    duration_value: 6,
    duration_unit: "weeks",
    location: "Algiers · Hydra",
    price: 89000,
    currency: "DZD",
    level: "advanced",
    includes: {
      challenges: true,
      resources: true,
      quizzes: false,
      support: true,
      certificate: true,
      final_project: true,
      classrooms: true,
    },
    status: "draft",
    thumbnail: null,
    cover_image: null,
    preview_video: null,
    brochure_available: false,
    brochure_name: null,
    published_at: null,
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
    registered_count: 8,
    instructor: null,
    schedules: [
      {
        id: "schedule-1",
        bootcamp_id: "ev-hybrid",
        starts_at: "2026-11-10",
        ends_at: "2026-12-08",
        is_available: true,
      },
    ],
    sections: [
      {
        id: "section-1",
        title: "High-voltage safety",
        position: 1,
        lessons: [
          {
            id: "lesson-1",
            title: "Isolation procedures",
            classroom_count: 2,
            duration_minutes: 90,
            position: 1,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function renderEditor() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const router = createMemoryRouter(
    [
      {
        path: "/instructor/bootcamps/:bootcampId",
        element: <InstructorBootcampEditorPage />,
      },
      {
        path: "/instructor/bootcamps",
        element: <div>Bootcamps list</div>,
      },
    ],
    { initialEntries: ["/instructor/bootcamps/ev-hybrid"] },
  );

  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe("InstructorBootcampEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedBootcampQuery.mockReturnValue({
      data: makeBootcamp(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    mockedRegistrationsQuery.mockReturnValue({
      data: { data: [], links: {}, meta: {} },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    mockedUpdate.mockResolvedValue(makeBootcamp({ title: "Updated title" }));
    mockedSync.mockResolvedValue(makeBootcamp().sections);
    mockedCreateSchedule.mockResolvedValue(makeBootcamp().schedules[0]);
    mockedUploadMedia.mockResolvedValue(
      makeBootcamp({
        thumbnail: "http://api.test/storage/bootcamps/ev-hybrid/thumb.jpg",
      }),
    );
    mockedRemoveMedia.mockResolvedValue(makeBootcamp({ thumbnail: null }));
  });

  it("loads the authored overview and saves changes", async () => {
    renderEditor();

    expect(
      screen.getByRole("heading", { level: 1, name: "EV & Hybrid Systems" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Title")).toHaveValue("EV & Hybrid Systems");
    expect(screen.getByLabelText("Duration")).toHaveValue(6);
    expect(screen.getByLabelText("Unit")).toHaveValue("weeks");

    const locationSelect = screen.getByLabelText(
      "Location",
    ) as HTMLSelectElement;

    expect(locationSelect).toHaveValue("Algiers Campus");
    expect(
      Array.from(locationSelect.options).map((option) => option.value),
    ).toEqual(["EL-Oued Campus", "Algiers Campus", "Saudi Campus"]);

    expect(
      screen.getByRole("switch", { name: "Challenges" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: "Quizzes" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(
      screen.getByRole("switch", { name: "Final synthesis project" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("switch", { name: "Complete classrooms" }),
    ).toHaveAttribute("aria-checked", "true");

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save bootcamp" }));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith(
        "ev-hybrid",
        expect.objectContaining({
          title: "Updated title",
          duration_value: 6,
          duration_unit: "weeks",
          location: "Algiers Campus",
          price: 89000,
          includes: expect.objectContaining({
            challenges: true,
            quizzes: false,
          }),
        }),
      );
    });

    expect(await screen.findByText("Bootcamp saved.")).toBeInTheDocument();
  });

  it("edits sections and lessons in the curriculum tab", async () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Curriculum" }));

    expect(screen.getByLabelText("Section title")).toHaveValue(
      "High-voltage safety",
    );
    expect(screen.getByLabelText("Lesson title")).toHaveValue(
      "Isolation procedures",
    );

    fireEvent.click(screen.getByRole("button", { name: "Add lesson" }));

    const lessonTitles = screen.getAllByLabelText("Lesson title");

    expect(lessonTitles).toHaveLength(2);

    fireEvent.change(lessonTitles[1], {
      target: { value: "Battery diagnostics" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save curriculum" }));

    await waitFor(() => {
      expect(mockedSync).toHaveBeenCalledWith("ev-hybrid", [
        expect.objectContaining({
          id: "section-1",
          title: "High-voltage safety",
          lessons: [
            expect.objectContaining({
              id: "lesson-1",
              title: "Isolation procedures",
            }),
            expect.objectContaining({
              title: "Battery diagnostics",
              classroom_count: 1,
              duration_minutes: 60,
            }),
          ],
        }),
      ]);
    });

    expect(await screen.findByText("Curriculum saved.")).toBeInTheDocument();
  });

  it("validates schedule dates before adding a session", async () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));

    const scheduleForm = screen
      .getByRole("button", { name: "Add session" })
      .closest("form") as HTMLFormElement;

    fireEvent.submit(scheduleForm);

    expect(
      await screen.findByText("Add both a start and end date."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-12-10" },
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-12-01" },
    });
    fireEvent.submit(scheduleForm);

    expect(
      await screen.findByText(
        "The end date must be on or after the start date.",
      ),
    ).toBeInTheDocument();
    expect(mockedCreateSchedule).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-12-20" },
    });
    fireEvent.submit(scheduleForm);

    await waitFor(() => {
      expect(mockedCreateSchedule).toHaveBeenCalledWith("ev-hybrid", {
        starts_at: "2026-12-10",
        ends_at: "2026-12-20",
      });
    });

    expect(await screen.findByText("Session saved.")).toBeInTheDocument();
  });

  it("shows registered students with their chosen site and payment", async () => {
    mockedRegistrationsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "registration-1",
            bootcamp_id: "ev-hybrid",
            bootcamp_schedule_id: "schedule-1",
            first_name: "Sara",
            last_name: "Khelifi",
            email: "sara@example.com",
            phone: "+213 555 000 000",
            site: "algiers_hydra",
            payment_method: "bank_transfer",
            terms_accepted: true,
            status: "pending",
            created_at: "2026-10-26T10:00:00.000Z",
            schedule: makeBootcamp().schedules[0],
          },
        ],
        links: {},
        meta: {},
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Students" }));

    const row = screen.getByText("Sara Khelifi").closest("tr") as HTMLElement;

    expect(within(row).getByText("sara@example.com")).toBeInTheDocument();
    expect(within(row).getByText("Algiers · Hydra")).toBeInTheDocument();
    expect(within(row).getByText("Bank transfer")).toBeInTheDocument();
    expect(
      within(row).getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
  });

  it("uploads and removes bootcamp media from the media tab", async () => {
    mockedBootcampQuery.mockReturnValue({
      data: makeBootcamp({
        thumbnail:
          "http://api.test/storage/bootcamps/ev-hybrid/thumbnail.jpg",
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Media" }));

    const card = screen.getByTestId("bootcamp-media-thumbnail");

    expect(
      within(card).getByAltText("Bootcamp thumbnail"),
    ).toHaveAttribute(
      "src",
      "http://api.test/storage/bootcamps/ev-hybrid/thumbnail.jpg",
    );

    const file = new File(["image-bytes"], "thumbnail.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(
      within(card).getByLabelText("Choose file Thumbnail"),
      { target: { files: [file] } },
    );
    fireEvent.click(within(card).getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(mockedUploadMedia).toHaveBeenCalledWith(
        "ev-hybrid",
        "thumbnail",
        file,
      );
    });

    expect(await screen.findByText("Media uploaded.")).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(mockedRemoveMedia).toHaveBeenCalledWith(
        "ev-hybrid",
        "thumbnail",
      );
    });

    expect(await screen.findByText("Media removed.")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("blocks publishing while overview edits are unsaved", async () => {
    renderEditor();

    const publishButtons = screen.getAllByRole("button", {
      name: "Publish bootcamp",
    });

    expect(publishButtons.every((button) => !button.hasAttribute("disabled"))).toBe(
      true,
    );
    expect(
      screen.queryByTestId("bootcamp-publish-blocked"),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated title" },
    });

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(
      publishButtons.every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
    expect(screen.getByTestId("bootcamp-publish-blocked")).toHaveTextContent(
      "Save the bootcamp and curriculum before publishing.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Save bootcamp" }));

    await waitFor(() => {
      expect(
        publishButtons.every((button) => !button.hasAttribute("disabled")),
      ).toBe(true);
    });
  });

  it("keeps curriculum drafts and publish gating across tab switches", async () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Curriculum" }));
    fireEvent.change(screen.getByLabelText("Section title"), {
      target: { value: "Updated safety section" },
    });

    expect(
      screen
        .getAllByRole("button", { name: "Publish bootcamp" })
        .every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
    expect(screen.getByTestId("bootcamp-publish-blocked")).toHaveTextContent(
      "Save the bootcamp and curriculum before publishing.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    fireEvent.click(screen.getByRole("button", { name: "Curriculum" }));

    expect(screen.getByLabelText("Section title")).toHaveValue(
      "Updated safety section",
    );
    expect(screen.getByTestId("bootcamp-curriculum-save")).toBeEnabled();
  });

  it("warns before leaving with unsaved changes", async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Unsaved bootcamp" },
    });
    fireEvent.click(screen.getByRole("link", { name: "Bootcamps" }));

    const dialog = await screen.findByTestId("bootcamp-leave-dialog");

    expect(dialog).toHaveTextContent("Leave without saving?");

    fireEvent.click(screen.getByTestId("bootcamp-leave-stay"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("bootcamp-leave-dialog"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("Title")).toHaveValue("Unsaved bootcamp");
  });
});
