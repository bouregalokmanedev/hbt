import { z } from "zod";
import { Vehicle } from "../schema";

/** Vehicles (VEH, 4) with per-tool coverage maps that gate the tools (06 §0). */
export const VEH: Vehicle[] = [
  {
    id: "corolla",
    name: "Toyota Corolla 1.6 16V VVT-i",
    engine: "1ZR-FE",
    transmission: "6 MT",
    vin: "JTNBV58E90J123456",
    odometerKm: 98420,
    installed: true,
    coverage: { scanner: "ok", multimeter: "ok", oscilloscope: "ok", location: "ok", schematic: "ok" },
  },
  {
    id: "camry",
    name: "Toyota Camry 2.5",
    engine: "A25A-FKS",
    transmission: "8 AT",
    vin: "4T1BZ1FB7LU012345",
    odometerKm: 42110,
    installed: false,
    coverage: { scanner: "avail", multimeter: "avail", oscilloscope: "avail", location: "avail", schematic: "avail" },
  },
  {
    id: "golf",
    name: "VW Golf 1.6 TDI",
    engine: "CZCA",
    transmission: "5 MT",
    vin: "WVWZZZ1KZAW000111",
    odometerKm: 176500,
    installed: false,
    coverage: { scanner: "ok", multimeter: "avail", oscilloscope: "none", location: "avail", schematic: "none" },
  },
  {
    id: "i30",
    name: "Hyundai i30 1.6 CRDi",
    engine: "D4FB",
    transmission: "6 MT",
    vin: "TMAD381CAFJ099887",
    odometerKm: 121300,
    installed: false,
    coverage: { scanner: "none", multimeter: "none", oscilloscope: "none", location: "none", schematic: "none" },
  },
];

export const VEHSchema = z.array(Vehicle);

export function vehicleById(id: string): Vehicle | undefined {
  return VEH.find((v) => v.id === id);
}
