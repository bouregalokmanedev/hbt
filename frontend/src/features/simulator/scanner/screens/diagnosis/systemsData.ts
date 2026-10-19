import {
    vehicleSystemsStore,
    SYSTEM_KEYS,
    type EcuNode,
    type SystemKey,
} from "@/features/instructor/data/vehicleSystems";

/* Student-side view of the instructor's scanner-lab systems tree.
   The builder (instructor/data/vehicleSystems) owns the shared model —
   we read the same store so authored systems/ECU cards show up here.
   Diagnosis variant ids are "backend:<uuid>" — strip the prefix to match
   the key the instructor builder saves under. */

export { SYSTEM_KEYS };
export type { EcuNode, SystemKey };

export function variantSystemsKey(variantId: string): string {
    return variantId.startsWith("backend:") ? variantId.slice("backend:".length) : variantId;
}

export function loadEcuSystems(variantId: string): Record<SystemKey, EcuNode[]> {
    return vehicleSystemsStore.getSystems(variantSystemsKey(variantId)).systems;
}
