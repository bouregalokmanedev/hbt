/**
 * Diagnostic-tablet home-screen overlay (D8 device art on SC-01).
 * Class-B structure only: hit-box geometry (measured from the device art,
 * 1000×1000 px) + where each on-device button routes. Button captions are
 * burned into the image (canonical English); localized aria-labels live in
 * `scanner.device.*` and are resolved by the UI.
 */
import type { ScannerScreen } from "../screens/types";

export type DeviceAction = "assistant";

export interface DeviceButton {
  id: string;
  /** Top-left corner + size as a % of the image (measured, see header). */
  x: number;
  y: number;
  w: number;
  h: number;
  route?: ScannerScreen; // opens a scanner screen
  action?: DeviceAction; // non-route action (opens the AI drawer)
}

export const DEVICE_IMAGE = "/assets/simulator/device-d8.webp";

/** Visible crop of the art: full width, y 225→765 of 1000 (tablet only). */
export const DEVICE_CROP = { top: 22.5, height: 54 };

export const DEVICE_BUTTONS: DeviceButton[] = [
  { id: "special", x: 26.7, y: 37.5, w: 13.0, h: 8.6, route: "adas" },
  { id: "report", x: 26.7, y: 46.2, w: 13.0, h: 8.8, route: "report" },
  { id: "remote", x: 26.7, y: 55.1, w: 13.0, h: 8.6, action: "assistant" },
  { id: "autoscan", x: 40.9, y: 37.5, w: 18.0, h: 9.1, route: "scan" },
  { id: "diagnosis", x: 40.9, y: 46.7, w: 18.0, h: 17.0, route: "select" },
  { id: "updates", x: 60.3, y: 37.5, w: 12.7, h: 8.6, route: "settings" },
  { id: "setting", x: 60.3, y: 46.2, w: 12.7, h: 8.8, route: "settings" },
  { id: "more", x: 60.3, y: 55.1, w: 12.7, h: 8.6, route: "systems" },
];
