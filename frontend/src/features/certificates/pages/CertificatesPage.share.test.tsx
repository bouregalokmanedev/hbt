import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { CertificatesPage } from "./CertificatesPage";
import { certificateVerifyPath, getCertificates } from "../api/certificates.api";
import type { Certificate } from "../types/certificate.types";

vi.mock("../api/certificates.api", () => ({
  getCertificates: vi.fn(),
  downloadCertificate: vi.fn(),
  certificateVerifyPath: (certificate: Certificate) =>
    `/verify/${certificate.certificate_number}`,
}));

const certificate: Certificate = {
  id: "cert-1",
  certificate_number: "HBT-9F2K-4410",
  recipient_name: "Lokmane Bourega",
  course_title: "Thermal Systems",
  issued_at: "2026-05-04T10:00:00Z",
  verification_url: "https://example.test/verify/HBT-9F2K-4410",
};

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <CertificatesPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("CertificatesPage share + verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCertificates).mockResolvedValue([certificate]);
  });

  it("links verification to the in-app verify route instead of the raw API", async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByTestId("certificate-verify-HBT-9F2K-4410"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByTestId("certificate-verify-HBT-9F2K-4410"),
    ).toHaveAttribute("href", "/verify/HBT-9F2K-4410");
  });

  it("shares the public verification link through the native share sheet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "share", {
      value: share,
      configurable: true,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByTestId("certificate-share-HBT-9F2K-4410"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("certificate-share-HBT-9F2K-4410"));

    await waitFor(() => {
      expect(share).toHaveBeenCalledTimes(1);
    });

    expect(share.mock.calls[0][0].url).toContain(
      certificateVerifyPath(certificate),
    );
  });
});
