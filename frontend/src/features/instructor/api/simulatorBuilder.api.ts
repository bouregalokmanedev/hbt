import { api } from "@/lib/api/client";

export interface SimCatalogVariant {
    id: string;
    name: string;
    engine_code: string | null;
    fuel_type: string | null;
    transmission: string | null;
    year_from: number | null;
    year_to: number | null;
    metadata: Record<string, unknown> | null;
    packs_count: number;
}

export interface SimCatalogModel {
    id: string;
    name: string;
    variants: SimCatalogVariant[];
}

export interface SimCatalogMake {
    id: string;
    name: string;
    slug: string;
    models: SimCatalogModel[];
}

export interface SimFaultPack {
    id: string;
    vehicle_variant_id: string;
    code: string;
    version: string;
    status: "draft" | "submitted" | "published" | "rejected" | "archived";
    manifest: unknown[];
    created_by: number | null;
    updated_at: string | null;
    variant?: { id: string; name: string; engine_code: string | null } | null;
}

export interface CreateVariantPayload {
    make_name: string;
    model_name: string;
    name: string;
    engine_code?: string;
    fuel_type?: string;
    transmission?: string;
    year_from?: number;
    year_to?: number;
    vin?: string;
    odometer_km?: number;
    coverage?: Record<string, string>;
}

export interface CreatePackPayload {
    code: string;
    version: string;
    manifest: unknown[];
}

const MANIFEST_TEMPLATE: unknown[] = [
    {
        nodes: [{ id: "ECM", status: "fault", dtc: 2 }],
        dtcs: [
            {
                code: "P0087",
                desc: "Fuel rail/system pressure too low",
                ecu: "ECM",
                status: "Current",
                severity: "high",
                count: 2,
            },
        ],
        pids: [{ id: "FRP", base: 8.4, fault: true }],
        adasDone: [true, true, false, false, false, false],
    },
];

export { MANIFEST_TEMPLATE };

export const simulatorBuilderApi = {
    vehicles: () => api<SimCatalogMake[]>("/v1/instructor/simulator/vehicles"),
    createVariant: (payload: CreateVariantPayload) =>
        api<SimCatalogVariant>("/v1/instructor/simulator/vehicles/variants", { method: "POST", body: payload }),
    updateVariant: (id: string, payload: Partial<CreateVariantPayload>) =>
        api<SimCatalogVariant>(`/v1/instructor/simulator/vehicles/variants/${id}`, { method: "PATCH", body: payload }),
    packs: (variantId: string) =>
        api<SimFaultPack[]>(`/v1/instructor/simulator/variants/${variantId}/packs`),
    createPack: (variantId: string, payload: CreatePackPayload) =>
        api<SimFaultPack>(`/v1/instructor/simulator/variants/${variantId}/packs`, { method: "POST", body: payload }),
    updatePack: (id: string, payload: Partial<CreatePackPayload>) =>
        api<SimFaultPack>(`/v1/instructor/simulator/packs/${id}`, { method: "PATCH", body: payload }),
    submitPack: (id: string) =>
        api<SimFaultPack>(`/v1/instructor/simulator/packs/${id}/submit`, { method: "POST" }),
    archivePack: (id: string) =>
        api<SimFaultPack>(`/v1/instructor/simulator/packs/${id}/archive`, { method: "POST" }),
    restorePack: (id: string) =>
        api<SimFaultPack>(`/v1/instructor/simulator/packs/${id}/restore`, { method: "POST" }),
    destroyPack: (id: string) =>
        api<{ success: boolean }>(`/v1/instructor/simulator/packs/${id}`, { method: "DELETE" }),
    destroyVariant: (id: string) =>
        api<{ success: boolean }>(`/v1/instructor/simulator/vehicles/variants/${id}`, { method: "DELETE" }),
    reviewQueue: () => api<SimFaultPack[]>("/v1/instructor/simulator/review"),
    approvePack: (id: string) =>
        api<SimFaultPack>(`/v1/instructor/simulator/packs/${id}/approve`, { method: "POST" }),
    rejectPack: (id: string, reason?: string) =>
        api<SimFaultPack>(`/v1/instructor/simulator/packs/${id}/reject`, {
            method: "POST",
            body: reason ? { reason } : {},
        }),
};
