import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CarFront } from "lucide-react";
import {
    SPECIAL_FUNCTIONS,
    type SpecialFunctionDef,
} from "@/features/instructor/data/specialFunctions";
import {
    useSpecialFunctionInstances,
    type SpecialFunctionInstance,
} from "@/features/instructor/data/specialFunctionsStore";
import { markScannerStep } from "../../lib/scannerProgress";
import {
    CARD_BORDER,
    CARD_BTN,
    CARD_FACE,
    CARD_SHADOW,
    CrumbBar,
    ObdGateModal,
    PANE_BG,
    TopBar,
} from "../diagnosis/chrome";

/* Student view of the special functions the instructor authored in the
   scanner-lab builder (shared localStorage store):
   vehicle picker → OBD check popup → that vehicle's functions → detail. */

type Props = {
    onExit: () => void;
    vciConnected?: boolean;
};

type FlowScreen = "vehicles" | "functions" | "detail";

type VehicleGroup = {
    variantId: string;
    label: string;
    instances: SpecialFunctionInstance[];
};

function functionDef(functionId: string): SpecialFunctionDef | null {
    return SPECIAL_FUNCTIONS.find((fn) => fn.id === functionId) ?? null;
}

function groupByVehicle(
    instances: SpecialFunctionInstance[],
): VehicleGroup[] {
    const groups = new Map<string, VehicleGroup>();
    for (const instance of instances) {
        const key = instance.vehicleVariantId || instance.vehicleLabel;
        const existing = groups.get(key);
        if (existing) {
            existing.instances.push(instance);
        } else {
            groups.set(key, {
                variantId: key,
                label: instance.vehicleLabel,
                instances: [instance],
            });
        }
    }
    return [...groups.values()];
}

export function SpecialFunctionsFlow({ onExit, vciConnected = false }: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.specialFunctions";
    const instances = useSpecialFunctionInstances();
    const [screen, setScreen] = useState<FlowScreen>("vehicles");
    const [variantId, setVariantId] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const [pending, setPending] = useState<VehicleGroup | null>(null);

    const vehicles = useMemo(() => groupByVehicle(instances), [instances]);
    const selected = vehicles.find((v) => v.variantId === variantId) ?? null;
    const open =
        selected?.instances.find((i) => i.id === openId) ?? null;

    // Store may have changed underneath us — snap back to a valid screen.
    const effective: FlowScreen =
        screen === "detail" && !open
            ? selected
                ? "functions"
                : "vehicles"
            : screen === "functions" && !selected
              ? "vehicles"
              : screen;

    let body: ReactNode;

    if (effective === "detail" && open && selected) {
        const def = functionDef(open.functionId);
        const Icon = def?.icon;
        body = (
            <div className="absolute inset-0 flex flex-col">
                <TopBar
                    onBack={() => setOpenId(null)}
                    title={open.title || def?.label || t(`${cs}.title`)}
                    vciConnected={vciConnected}
                />
                <CrumbBar
                    text={`${selected.label}${def ? ` > ${def.label}` : ""}`}
                />

                <div
                    className="min-h-0 flex-1 overflow-y-auto p-[2.4cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ background: PANE_BG }}
                >
                    <div className="mx-auto flex w-[86%] max-w-[980px] flex-col items-center gap-[2cqw]">
                        {open.image ? (
                            <img
                                src={open.image}
                                alt={open.title}
                                className="max-h-[36cqw] w-auto rounded-[1cqw] border border-[#c9ced6] bg-white object-contain p-[0.8cqw]"
                                style={{ boxShadow: CARD_SHADOW }}
                            />
                        ) : (
                            <div
                                className="flex aspect-[16/7] w-full items-center justify-center rounded-[1cqw] border border-[#c9ced6]"
                                style={{ background: CARD_FACE, boxShadow: CARD_SHADOW }}
                            >
                                {Icon ? (
                                    <Icon
                                        strokeWidth={1.5}
                                        className="text-[#5a6572]"
                                        style={{ width: "11cqw", height: "11cqw" }}
                                    />
                                ) : null}
                            </div>
                        )}

                        <span
                            className="rounded-full border border-[#d5dbe3] bg-[#eef2f7] px-[1.4cqw] py-[0.4cqw] font-semibold text-[#5a6572]"
                            style={{ fontSize: "1.3cqw" }}
                        >
                            {def?.label ?? open.functionId}
                        </span>

                        <h2
                            className="text-center font-bold text-[#33383f]"
                            style={{ fontSize: "2.6cqw" }}
                        >
                            {open.title}
                        </h2>

                        <p
                            className="w-full rounded-[0.8cqw] border border-[#c9ced6] bg-white px-[2cqw] py-[1.6cqw] leading-relaxed text-[#3f444c]"
                            style={{ fontSize: "1.6cqw", boxShadow: CARD_SHADOW }}
                        >
                            {open.description || t(`${cs}.noDescription`)}
                        </p>

                        {open.vehicleLabel ? (
                            <span
                                className="self-start rounded-full border border-[#d5dbe3] bg-[#eef2f7] px-[1.4cqw] py-[0.4cqw] font-semibold text-[#5a6572]"
                                style={{ fontSize: "1.25cqw" }}
                            >
                                {t(`${cs}.vehicle`)}: {open.vehicleLabel}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    } else if (effective === "functions" && selected) {
        body = (
            <div className="absolute inset-0 flex flex-col">
                <TopBar
                    onBack={() => {
                        setVariantId(null);
                        setOpenId(null);
                        setScreen("vehicles");
                    }}
                    title={selected.label}
                    vciConnected={vciConnected}
                />
                <CrumbBar text={t(`${cs}.title`)} />

                <div
                    className="min-h-0 flex-1 overflow-y-auto p-[1.8cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ background: PANE_BG }}
                >
                    <div className="grid grid-cols-4 gap-[1.5cqw]">
                        {selected.instances.map((instance) => (
                            <InstanceCard
                                key={instance.id}
                                instance={instance}
                                vehicleLabelPrefix={t(`${cs}.vehicle`)}
                                onOpen={() => {
                                    setOpenId(instance.id);
                                    setScreen("detail");
                                    markScannerStep("specialFunction");
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    } else {
        body = (
            <div className="absolute inset-0 flex flex-col">
                <TopBar
                    onBack={onExit}
                    title={t(`${cs}.title`)}
                    vciConnected={vciConnected}
                />

                <div
                    className="relative min-h-0 flex-1"
                    style={{ background: PANE_BG }}
                >
                    {instances.length === 0 ? (
                        <div className="grid h-full place-items-center">
                            <div className="text-center">
                                <p className="text-[#7d8590]" style={{ fontSize: "1.7cqw" }}>
                                    {t(`${cs}.empty`)}
                                </p>
                                <p
                                    className="mt-[1cqw] text-[#9aa1ab]"
                                    style={{ fontSize: "1.3cqw" }}
                                >
                                    {t(`${cs}.emptyHint`)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto p-[1.8cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <p
                                className="mb-[1.6cqw] px-[0.4cqw] font-semibold text-[#5a6572]"
                                style={{ fontSize: "1.5cqw" }}
                            >
                                {t(`${cs}.pickVehicle`)}
                            </p>
                            <div className="grid grid-cols-4 gap-[1.5cqw]">
                                {vehicles.map((vehicle) => (
                                    <VehicleCard
                                        key={vehicle.variantId}
                                        vehicle={vehicle}
                                        functionsText={t(`${cs}.functions`, {
                                            count: vehicle.instances.length,
                                        })}
                                        onPick={() => setPending(vehicle)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0">
            {body}

            {pending ? (
                <ObdGateModal
                    mode="check"
                    vciConnected={vciConnected}
                    onCancel={() => setPending(null)}
                    onConfirm={() => {
                        setVariantId(pending.variantId);
                        setOpenId(null);
                        setScreen("functions");
                        setPending(null);
                    }}
                />
            ) : null}
        </div>
    );
}

function VehicleCard({
    vehicle,
    functionsText,
    onPick,
}: {
    vehicle: VehicleGroup;
    functionsText: string;
    onPick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onPick}
            aria-label={`${vehicle.label}, ${functionsText}`}
            className={`flex flex-col items-center gap-[1.2cqw] overflow-hidden rounded-[0.7cqw] px-[1.2cqw] py-[2cqw] ${CARD_BTN}`}
            style={{
                background: CARD_FACE,
                border: `1px solid ${CARD_BORDER}`,
                boxShadow: CARD_SHADOW,
            }}
        >
            <CarFront
                strokeWidth={1.5}
                className="text-[#5a6572]"
                aria-hidden="true"
                style={{ width: "6.4cqw", height: "6.4cqw" }}
            />
            <span
                className="w-full truncate text-center font-bold text-[#3d4450]"
                style={{ fontSize: "1.6cqw" }}
            >
                {vehicle.label}
            </span>
            <span
                className="max-w-full truncate rounded-full border border-[#d5dbe3] bg-[#eef2f7] px-[1.2cqw] py-[0.3cqw] font-semibold text-[#5a6572]"
                style={{ fontSize: "1.15cqw" }}
            >
                {functionsText}
            </span>
        </button>
    );
}

function InstanceCard({
    instance,
    vehicleLabelPrefix,
    onOpen,
}: {
    instance: SpecialFunctionInstance;
    vehicleLabelPrefix: string;
    onOpen: () => void;
}) {
    const def = functionDef(instance.functionId);
    const Icon = def?.icon;
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={instance.title || def?.label || instance.functionId}
            className={`flex flex-col items-center gap-[1cqw] overflow-hidden rounded-[0.7cqw] px-[1.2cqw] py-[1.4cqw] ${CARD_BTN}`}
            style={{
                background: CARD_FACE,
                border: `1px solid ${CARD_BORDER}`,
                boxShadow: CARD_SHADOW,
            }}
        >
            {instance.image ? (
                <img
                    src={instance.image}
                    alt=""
                    className="h-[9cqw] w-full rounded-[0.5cqw] bg-white object-contain"
                />
            ) : (
                <span
                    className="grid h-[9cqw] w-full place-items-center rounded-[0.5cqw] bg-[#eef2f7]"
                    aria-hidden="true"
                >
                    {Icon ? (
                        <Icon
                            strokeWidth={1.6}
                            className="text-[#5a6572]"
                            style={{ width: "4.6cqw", height: "4.6cqw" }}
                        />
                    ) : null}
                </span>
            )}
            <span
                className="w-full truncate text-center font-bold text-[#3d4450]"
                style={{ fontSize: "1.5cqw" }}
            >
                {instance.title || def?.label}
            </span>
            <span
                className="w-full truncate text-center text-[#9aa1ab]"
                style={{ fontSize: "1.1cqw" }}
            >
                {def?.label}
            </span>
            {instance.vehicleLabel ? (
                <span
                    className="max-w-full truncate rounded-full border border-[#d5dbe3] bg-[#eef2f7] px-[1cqw] py-[0.25cqw] font-semibold text-[#5a6572]"
                    style={{ fontSize: "1cqw" }}
                >
                    {vehicleLabelPrefix}: {instance.vehicleLabel}
                </span>
            ) : null}
        </button>
    );
}
