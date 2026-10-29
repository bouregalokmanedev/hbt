import { fireEvent, render, screen, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type {
  Bootcamp,
  BootcampRegistration,
} from "@/features/bootcamps/types/bootcamp.types";

vi.mock("../api/bootcamps.api", () => ({
  bootcampsApi: {
    list: vi.fn(),
    get: vi.fn(),
    calendar: vi.fn(),
    register: vi.fn(),
    brochureUrl: (bootcampId: string) =>
      `http://api.test/v1/bootcamps/${bootcampId}/brochure`,
  },
}));

import { bootcampsApi } from "../api/bootcamps.api";
import { BootcampDetailsPage } from "./BootcampDetailsPage";

const mockedGet = vi.mocked(bootcampsApi.get);
const mockedList = vi.mocked(bootcampsApi.list);
const mockedRegister = vi.mocked(bootcampsApi.register);

function makeBootcamp(overrides: Partial<Bootcamp> = {}): Bootcamp {
  return {
    id: "ev-hybrid",
    title: "EV & Hybrid Systems",
    slug: "ev-hybrid-systems",
    short_description: "High-voltage safety and battery diagnosis.",
    description:
      "Work on live high-voltage vehicles, battery packs and hybrid powertrains.",
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
    status: "published",
    thumbnail: "http://api.test/storage/bootcamps/ev-hybrid/thumbnail.jpg",
    cover_image: "http://api.test/storage/bootcamps/ev-hybrid/cover.jpg",
    preview_video: "http://api.test/storage/bootcamps/ev-hybrid/preview.mp4",
    brochure_available: true,
    brochure_name: "ev-hybrid-programme.pdf",
    published_at: "2026-10-01T10:00:00.000Z",
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
    registered_count: 8,
    instructor: {
      id: "instructor-1",
      first_name: "Amine",
      last_name: "Bensalem",
      username: "amine",
      avatar: null,
      bio: "Senior diagnostics instructor with 12 years in the workshop.",
    },
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

function listResponse(data: Bootcamp[]) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 6,
      to: data.length,
      total: data.length,
      path: "/v1/catalog/bootcamps",
      links: [],
    },
  };
}

function makeRegistration(): BootcampRegistration {
  return {
    id: "registration-1",
    bootcamp_id: "ev-hybrid",
    bootcamp_schedule_id: "schedule-1",
    first_name: "Sara",
    last_name: "Khelifi",
    email: "sara@example.com",
    phone: "+213 555 000 000",
    site: "algiers_hydra",
    payment_method: "cash",
    terms_accepted: true,
    status: "pending",
    created_at: "2026-10-26T10:00:00.000Z",
  };
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/bootcamps/ev-hybrid"]}>
        <Routes>
          <Route
            path="/bootcamps/:bootcampId"
            element={<BootcampDetailsPage />}
          />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("BootcampDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockResolvedValue(makeBootcamp());
    mockedList.mockResolvedValue(
      listResponse([
        makeBootcamp(),
        makeBootcamp({
          id: "can-bus",
          title: "CAN Bus & ECU Mastery",
          short_description: "Network faults, modules and live data.",
          level: "advanced",
          duration_value: 4,
          thumbnail:
            "http://api.test/storage/bootcamps/can-bus/thumbnail.jpg",
        }),
        makeBootcamp({
          id: "battery",
          title: "Battery Systems",
          short_description: "High-voltage battery diagnosis.",
          level: "intermediate",
          duration_value: 3,
          thumbnail: null,
        }),
      ]),
    );
    mockedRegister.mockResolvedValue(makeRegistration());
  });

  afterEach(() => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
  });

  it("renders every instructor-authored section", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "EV & Hybrid Systems",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Work on live high-voltage vehicles, battery packs and hybrid powertrains.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("6 weeks")).toBeInTheDocument();
    expect(screen.getAllByText("Algiers · Hydra").length).toBeGreaterThan(0);
    expect(screen.getByText("Amine Bensalem")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Senior diagnostics instructor with 12 years in the workshop.",
      ),
    ).toBeInTheDocument();

    // Uploaded cover and preview video are rendered.
    expect(
      screen.getByAltText("EV & Hybrid Systems cover image"),
    ).toHaveAttribute(
      "src",
      "http://api.test/storage/bootcamps/ev-hybrid/cover.jpg",
    );
    expect(
      screen.getByText("See the bootcamp in action"),
    ).toBeInTheDocument();

    // Payment methods are static and branded with Visa / Mastercard.
    expect(screen.getByText("Flexible ways to pay")).toBeInTheDocument();
    expect(
      screen.getAllByText("Online payment available").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Pay online and save 10%")).toBeInTheDocument();
    expect(screen.getByText("Visa / Mastercard")).toBeInTheDocument();
    expect(screen.getAllByText("Bank transfer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cash on site").length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("Visa").length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("Mastercard").length).toBeGreaterThan(0);

    expect(screen.getByText("High-voltage safety")).toBeInTheDocument();
    expect(screen.getByText("Isolation procedures")).toBeInTheDocument();
    expect(screen.getByText("2 classrooms")).toBeInTheDocument();
    expect(screen.getByText("90 min")).toBeInTheDocument();

    // Enabled and disabled includes are both visible, with the new package items.
    expect(screen.getByText("Challenges")).toBeInTheDocument();
    expect(screen.getByText("Quizzes")).toBeInTheDocument();
    expect(screen.getByText("Final synthesis project")).toBeInTheDocument();
    expect(screen.getByText("Complete classrooms")).toBeInTheDocument();
    expect(screen.getByText("6 of 7 included")).toBeInTheDocument();
    expect(screen.getAllByText("Included")).toHaveLength(6);
    expect(screen.getByText("Not included")).toBeInTheDocument();

    // Graduate career opportunities are promoted on the page.
    expect(
      screen.getByText("Your next opportunity starts here"),
    ).toBeInTheDocument();
    expect(screen.getByText("Job offers")).toBeInTheDocument();
    expect(screen.getByText("Interview preparation")).toBeInTheDocument();
    expect(screen.getByText("Industry network")).toBeInTheDocument();

    // The enrollment section carries the admissions copy and steps.
    expect(
      screen.getByRole("heading", { name: "Reserve Your Spot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("How to enroll in HBTronics training programs"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Complete the registration form to choose your training program.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Speak with an educational advisor to receive personalized guidance.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Pay your training fees using our available payment methods to secure your place in the program.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Once payment is completed, you will receive your access to start your training.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /download pdf/i }),
    ).toHaveAttribute("href", "http://api.test/v1/bootcamps/ev-hybrid/brochure");

    expect(
      screen.getByTestId("bootcamp-registration-form"),
    ).toBeInTheDocument();

    // Previous bootcamp gallery closes the page.
    expect(
      screen.getByRole("heading", { name: "Previous bootcamps" }),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "Technicians diagnosing a vehicle in the HBTronics workshop",
      ),
    ).toHaveAttribute("src", expect.stringContaining("pic-6"));
    expect(screen.getByText("Workshop floor")).toBeInTheDocument();
    expect(screen.getByText("Live vehicle scanning")).toBeInTheDocument();

    // Related bootcamp cards exclude the current programme.
    const related = await screen.findByTestId("related-bootcamps");

    expect(
      within(related).getByRole("heading", { name: "Related bootcamps" }),
    ).toBeInTheDocument();
    expect(within(related).getByText("CAN Bus & ECU Mastery")).toBeInTheDocument();
    expect(within(related).getByText("Battery Systems")).toBeInTheDocument();
    expect(
      within(related).queryByText("EV & Hybrid Systems"),
    ).not.toBeInTheDocument();
    expect(
      within(related).getAllByTestId("related-bootcamp-card")[0],
    ).toHaveAttribute("href", "/bootcamps/can-bus");
    expect(
      within(related).getByAltText("CAN Bus & ECU Mastery cover image"),
    ).toHaveAttribute(
      "src",
      "http://api.test/storage/bootcamps/can-bus/thumbnail.jpg",
    );
  });

  it("shows a quick-reserve card after scrolling and dismisses it", async () => {
    renderPage();

    await screen.findByRole("heading", {
      level: 1,
      name: "EV & Hybrid Systems",
    });

    expect(
      screen.queryByTestId("quick-reserve-bar"),
    ).not.toBeInTheDocument();

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 900,
    });
    fireEvent.scroll(window);

    const bar = await screen.findByTestId("quick-reserve-bar");

    expect(within(bar).getByText("EV & Hybrid Systems")).toBeInTheDocument();
    expect(within(bar).getAllByText(/89,000/).length).toBeGreaterThan(0);
    expect(
      within(bar).getByRole("link", { name: "Reserve Your Spot" }),
    ).toHaveAttribute("href", "#bootcamp-registration");

    fireEvent.click(
      within(bar).getByRole("button", {
        name: "Dismiss quick reservation",
      }),
    );

    expect(
      screen.queryByTestId("quick-reserve-bar"),
    ).not.toBeInTheDocument();
  });

  it("validates registration fields before calling the API", async () => {
    renderPage();

    const form = await screen.findByTestId("bootcamp-registration-form");

    fireEvent.click(
      within(form).getByRole("button", { name: "Reserve my spot" }),
    );

    expect(
      within(form).getAllByText("Please complete all required fields."),
    ).toHaveLength(4);

    expect(
      within(form).getByText("You must accept the terms to register."),
    ).toBeInTheDocument();

    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("submits the lead registration and shows the selected session", async () => {
    renderPage();

    const form = await screen.findByTestId("bootcamp-registration-form");

    const siteSelect = within(form).getByLabelText(
      "Training site",
    ) as HTMLSelectElement;

    expect(
      Array.from(siteSelect.options).map((option) => [option.value, option.text]),
    ).toEqual([
      ["el_oued", "EL-Oued Campus"],
      ["algiers", "Algiers Campus"],
      ["saudi", "Saudi Campus"],
    ]);

    fireEvent.change(within(form).getByLabelText("First name"), {
      target: { value: "Sara" },
    });
    fireEvent.change(within(form).getByLabelText("Last name"), {
      target: { value: "Khelifi" },
    });
    fireEvent.change(within(form).getByLabelText("Email address"), {
      target: { value: "sara@example.com" },
    });
    fireEvent.change(within(form).getByLabelText("Phone number"), {
      target: { value: "+213 555 000 000" },
    });
    fireEvent.click(within(form).getByRole("checkbox"));
    fireEvent.click(
      within(form).getByRole("button", { name: "Reserve my spot" }),
    );

    expect(
      await screen.findByTestId("bootcamp-registration-success"),
    ).toBeInTheDocument();

    expect(mockedRegister).toHaveBeenCalledWith(
      "ev-hybrid",
      expect.objectContaining({
        firstName: "Sara",
        lastName: "Khelifi",
        email: "sara@example.com",
        phone: "+213 555 000 000",
        scheduleId: "schedule-1",
        site: "el_oued",
        paymentMethod: "cash",
        termsAccepted: true,
      }),
    );

    expect(
      screen.getByText(/We have your request for EV & Hybrid Systems\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Session: 10 November – 8 December 2026/),
    ).toBeInTheDocument();
  });

  it("shows a registration error returned by the API", async () => {
    mockedRegister.mockRejectedValueOnce(new Error("Email already registered"));

    renderPage();

    const form = await screen.findByTestId("bootcamp-registration-form");

    fireEvent.change(within(form).getByLabelText("First name"), {
      target: { value: "Sara" },
    });
    fireEvent.change(within(form).getByLabelText("Last name"), {
      target: { value: "Khelifi" },
    });
    fireEvent.change(within(form).getByLabelText("Email address"), {
      target: { value: "sara@example.com" },
    });
    fireEvent.change(within(form).getByLabelText("Phone number"), {
      target: { value: "+213 555 000 000" },
    });
    fireEvent.click(within(form).getByRole("checkbox"));
    fireEvent.click(
      within(form).getByRole("button", { name: "Reserve my spot" }),
    );

    expect(
      await screen.findByText("Email already registered"),
    ).toBeInTheDocument();
  });
});
