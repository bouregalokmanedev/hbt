import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Plus, Trash2, X } from "lucide-react";

import { FaultCodeLibraryPicker } from "./FaultCodeLibraryPicker";
import { vehicleSystemsStore, LIVE_DATA_LIBRARY, type EcuNode, type EcuPid, type SystemKey, makeId } from "../data/vehicleSystems";

export type EcuAction = "info" | "dtc" | "live" | "actuator";

const SEVERITIES = ["high", "medium", "low"] as const;

function mutateEcu(variantId: string, systemKey: SystemKey, ecuId: string, fn: (ecu: EcuNode) => EcuNode) {
    vehicleSystemsStore.mutateSystems(variantId, (systems) => ({
        ...systems,
        systems: {
            ...systems.systems,
            [systemKey]: systems.systems[systemKey].map((ecu) => (ecu.id === ecuId ? fn(ecu) : ecu)),
        },
    }));
}

export function SystemEcuAuthoringModal({
    variantId,
    systemKey,
    ecu,
    action,
    onClose,
}: {
    variantId: string;
    systemKey: SystemKey;
    ecu: EcuNode;
    action: EcuAction;
    onClose: () => void;
}) {
    const { t } = useTranslation();

    // ECU info — system name defaults to the control-unit card title.
    const [systemName, setSystemName] = useState(ecu.info?.systemName ?? ecu.name);
    const [programmingDate, setProgrammingDate] = useState(ecu.info?.programmingDate ?? "");
    const [manufactureDate, setManufactureDate] = useState(ecu.info?.manufactureDate ?? "");
    const [supplier, setSupplier] = useState(ecu.info?.supplier ?? "none");
    const [serialNumber, setSerialNumber] = useState(ecu.info?.serialNumber ?? "");

    // DTC
    const [dtcCode, setDtcCode] = useState("");
    const [dtcDesc, setDtcDesc] = useState("");
    const [dtcSeverity, setDtcSeverity] = useState<string>("medium");
    const [dtcNote, setDtcNote] = useState("");
    const [dtcError, setDtcError] = useState<string | null>(null);

    // Live data
    const [pid, setPid] = useState("");
    const [pidLabel, setPidLabel] = useState("");
    const [pidUnit, setPidUnit] = useState("");
    const [pidBase, setPidBase] = useState("");
    const [pidError, setPidError] = useState<string | null>(null);

    // Actuator
    const [actName, setActName] = useState("");
    const [actDesc, setActDesc] = useState("");
    const [actError, setActError] = useState<string | null>(null);

    const title = t(`instructor.simulator.scannerLab.systems.modal.${action}`);

    const saveInfo = () => {
        mutateEcu(variantId, systemKey, ecu.id, (e) => ({
            ...e,
            info: {
                systemName: systemName.trim(),
                programmingDate,
                manufactureDate,
                supplier: supplier.trim(),
                serialNumber: serialNumber.trim(),
            },
        }));
        onClose();
    };

    const addDtc = () => {
        const code = dtcCode.trim().toUpperCase();
        if (!code) {
            setDtcError(t("instructor.simulator.scannerLab.systems.modal.required"));
            return;
        }
        const note = dtcNote.trim();
        mutateEcu(variantId, systemKey, ecu.id, (e) => ({
            ...e,
            dtcs: [...e.dtcs, { id: makeId(), code, desc: dtcDesc.trim(), severity: dtcSeverity, ...(note ? { note } : {}) }],
        }));
        setDtcCode("");
        setDtcDesc("");
        setDtcSeverity("medium");
        setDtcNote("");
        setDtcError(null);
    };

    const removeDtc = (id: string) =>
        mutateEcu(variantId, systemKey, ecu.id, (e) => ({ ...e, dtcs: e.dtcs.filter((d) => d.id !== id) }));

    const addPid = () => {
        const key = pid.trim().toUpperCase();
        if (!key) {
            setPidError(t("instructor.simulator.scannerLab.systems.modal.required"));
            return;
        }
        mutateEcu(variantId, systemKey, ecu.id, (e) => ({
            ...e,
            liveData: [...e.liveData, { id: makeId(), pid: key, label: pidLabel.trim(), unit: pidUnit.trim(), base: pidBase.trim() }],
        }));
        setPid("");
        setPidLabel("");
        setPidUnit("");
        setPidBase("");
        setPidError(null);
    };

    const removePid = (id: string) =>
        mutateEcu(variantId, systemKey, ecu.id, (e) => ({ ...e, liveData: e.liveData.filter((p) => p.id !== id) }));

    const updatePid = (id: string, patch: Partial<Pick<EcuPid, "base" | "unit" | "label">>) =>
        mutateEcu(variantId, systemKey, ecu.id, (e) => ({
            ...e,
            liveData: e.liveData.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));

    const addActuator = () => {
        const name = actName.trim();
        if (!name) {
            setActError(t("instructor.simulator.scannerLab.systems.modal.required"));
            return;
        }
        mutateEcu(variantId, systemKey, ecu.id, (e) => ({
            ...e,
            actuators: [...e.actuators, { id: makeId(), name, description: actDesc.trim() }],
        }));
        setActName("");
        setActDesc("");
        setActError(null);
    };

    const removeActuator = (id: string) =>
        mutateEcu(variantId, systemKey, ecu.id, (e) => ({ ...e, actuators: e.actuators.filter((a) => a.id !== id) }));

    const inputCls =
        "mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm font-normal text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]";
    const labelCls = "block text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]";

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-testid="ecu-authoring-modal"
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1115]/60 p-4 backdrop-blur-sm"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1b1b20]"
            >
                <div className="flex items-center justify-between gap-3 border-b border-[#3A3A3A]/10 bg-[#F8F7F6] px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">{title}</p>
                        <p className="mt-0.5 truncate text-xs text-[#3A3A3A]/50 dark:text-white/50">{ecu.name}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("instructor.simulator.scannerLab.systems.modal.close")}
                        data-testid="ecu-modal-close"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#3A3A3A]/12 text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:text-white/60"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </button>
                </div>

                <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
                    {action === "info" && (
                        <>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.systemName")}
                                <input value={systemName} onChange={(e) => setSystemName(e.target.value)} data-testid="info-system-name" className={inputCls} />
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.programmingDate")}
                                <input type="date" value={programmingDate} onChange={(e) => setProgrammingDate(e.target.value)} data-testid="info-programming-date" className={inputCls} />
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.manufactureDate")}
                                <input type="date" value={manufactureDate} onChange={(e) => setManufactureDate(e.target.value)} data-testid="info-manufacture-date" className={inputCls} />
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.supplier")}
                                <select value={supplier} onChange={(e) => setSupplier(e.target.value)} data-testid="info-supplier" className={inputCls}>
                                    <option value="none">{t("instructor.simulator.scannerLab.systems.modal.supplierNone")}</option>
                                    <option value="Bosch">Bosch</option>
                                    <option value="Continental">Continental</option>
                                    <option value="Denso">Denso</option>
                                    <option value="Valeo">Valeo</option>
                                    <option value="Hella">Hella</option>
                                    <option value="Siemens">Siemens</option>
                                    <option value="Magna">Magna</option>
                                    <option value="Aptiv">Aptiv</option>
                                </select>
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.serialNumber")}
                                <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} data-testid="info-serial-number" className={inputCls} dir="ltr" />
                            </label>
                            <button
                                type="button"
                                onClick={saveInfo}
                                data-testid="info-save"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                            >
                                {t("instructor.simulator.scannerLab.systems.modal.save")}
                            </button>
                        </>
                    )}

                    {action === "dtc" && (
                        <>
                            {ecu.dtcs.length > 0 && (
                                <ul className="space-y-2">
                                    {ecu.dtcs.map((d) => (
                                        <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#FDF9F6] px-3 py-2 dark:border-white/10 dark:bg-white/[.04]">
                                            <div className="min-w-0">
                                                <p className="font-mono text-xs font-bold text-[#2E2E2E] dark:text-[#ececef]" dir="ltr">
                                                    {d.code}
                                                </p>
                                                <p className="truncate text-[11px] text-[#3A3A3A]/55 dark:text-white/50">{d.desc || "—"}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeDtc(d.id)}
                                                aria-label={t("instructor.simulator.scannerLab.systems.modal.delete")}
                                                className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="relative">
                                <FaultCodeLibraryPicker
                                    onPick={(entry) => {
                                        setDtcCode(entry.code);
                                        setDtcDesc(entry.desc);
                                        setDtcSeverity(entry.severity);
                                    }}
                                />
                            </div>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.code")}
                                <input
                                    value={dtcCode}
                                    onChange={(e) => setDtcCode(e.target.value)}
                                    data-testid="dtc-code"
                                    dir="ltr"
                                    className={`${inputCls} font-mono uppercase`}
                                />
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.description")}
                                <input value={dtcDesc} onChange={(e) => setDtcDesc(e.target.value)} data-testid="dtc-desc" className={inputCls} />
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.severity")}
                                <select value={dtcSeverity} onChange={(e) => setDtcSeverity(e.target.value)} data-testid="dtc-severity" className={inputCls}>
                                    {SEVERITIES.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.note")}
                                <textarea
                                    value={dtcNote}
                                    onChange={(e) => setDtcNote(e.target.value)}
                                    data-testid="dtc-note"
                                    rows={2}
                                    placeholder={t("instructor.simulator.scannerLab.systems.modal.notePh")}
                                    className={`${inputCls} resize-none`}
                                />
                            </label>
                            {dtcError && (
                                <p role="alert" className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-300">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {dtcError}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={addDtc}
                                data-testid="dtc-add"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t("instructor.simulator.scannerLab.systems.modal.add")}
                            </button>
                        </>
                    )}

                    {action === "live" && (
                        <>
                            {ecu.liveData.length > 0 && (
                                <ul className="space-y-2">
                                    {ecu.liveData.map((p) => (
                                        <li key={p.id} className="rounded-xl border border-[#3A3A3A]/10 bg-[#FDF9F6] px-3 py-2 dark:border-white/10 dark:bg-white/[.04]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-mono text-xs font-bold text-[#2E2E2E] dark:text-[#ececef]" dir="ltr">
                                                        {p.pid}
                                                    </p>
                                                    <p className="truncate text-[11px] text-[#3A3A3A]/55 dark:text-white/50">{p.label || "—"}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removePid(p.id)}
                                                    aria-label={t("instructor.simulator.scannerLab.systems.modal.delete")}
                                                    className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                                </button>
                                            </div>
                                            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                                                <label className="block">
                                                    <span className="block text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">
                                                        {t("instructor.simulator.scannerLab.systems.modal.value")}
                                                    </span>
                                                    <input
                                                        value={p.base}
                                                        onChange={(e) => updatePid(p.id, { base: e.target.value })}
                                                        data-testid={`live-value-${p.id}`}
                                                        dir="ltr"
                                                        inputMode="decimal"
                                                        className={`${inputCls} h-9 font-mono`}
                                                    />
                                                </label>
                                                <label className="block w-24">
                                                    <span className="block text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">
                                                        {t("instructor.simulator.scannerLab.systems.modal.unit")}
                                                    </span>
                                                    <input
                                                        value={p.unit}
                                                        onChange={(e) => updatePid(p.id, { unit: e.target.value })}
                                                        data-testid={`live-unit-${p.id}`}
                                                        dir="ltr"
                                                        className={`${inputCls} h-9`}
                                                    />
                                                </label>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.pickParam")}
                                <select
                                    value=""
                                    onChange={(e) => {
                                        const param = LIVE_DATA_LIBRARY.find((p) => p.pid === e.target.value);
                                        if (!param) return;
                                        setPid(param.pid);
                                        setPidLabel(param.label);
                                        setPidUnit(param.unit);
                                        setPidBase(param.base);
                                        setPidError(null);
                                    }}
                                    data-testid="live-pick"
                                    className={inputCls}
                                >
                                    <option value="">{t("instructor.simulator.scannerLab.systems.modal.pickParamPh")}</option>
                                    {["engine", "mixture", "misfire", "rough", "knock", "status"].map((group) => (
                                        <optgroup
                                            key={group}
                                            label={t(`instructor.simulator.scannerLab.systems.modal.groups.${group}`)}
                                        >
                                            {LIVE_DATA_LIBRARY.filter((p) => p.group === group).map((p) => (
                                                <option key={p.pid} value={p.pid}>
                                                    {p.label}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.pid")}
                                <input value={pid} onChange={(e) => setPid(e.target.value)} data-testid="live-pid" dir="ltr" className={`${inputCls} font-mono uppercase`} />
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.label")}
                                <input value={pidLabel} onChange={(e) => setPidLabel(e.target.value)} data-testid="live-label" className={inputCls} />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={labelCls}>
                                    {t("instructor.simulator.scannerLab.systems.modal.unit")}
                                    <input value={pidUnit} onChange={(e) => setPidUnit(e.target.value)} data-testid="live-unit" className={inputCls} />
                                </label>
                                <label className={labelCls}>
                                    {t("instructor.simulator.scannerLab.systems.modal.value")}
                                    <input value={pidBase} onChange={(e) => setPidBase(e.target.value)} data-testid="live-base" inputMode="decimal" className={inputCls} />
                                </label>
                            </div>
                            {pidError && (
                                <p role="alert" className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-300">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {pidError}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={addPid}
                                data-testid="live-add"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t("instructor.simulator.scannerLab.systems.modal.add")}
                            </button>
                        </>
                    )}

                    {action === "actuator" && (
                        <>
                            {ecu.actuators.length > 0 && (
                                <ul className="space-y-2">
                                    {ecu.actuators.map((a) => (
                                        <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#FDF9F6] px-3 py-2 dark:border-white/10 dark:bg-white/[.04]">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-bold text-[#2E2E2E] dark:text-[#ececef]">{a.name}</p>
                                                <p className="truncate text-[11px] text-[#3A3A3A]/55 dark:text-white/50">{a.description || "—"}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeActuator(a.id)}
                                                aria-label={t("instructor.simulator.scannerLab.systems.modal.delete")}
                                                className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.name")}
                                <input value={actName} onChange={(e) => setActName(e.target.value)} data-testid="act-name" className={inputCls} />
                            </label>
                            <label className={labelCls}>
                                {t("instructor.simulator.scannerLab.systems.modal.description")}
                                <textarea
                                    value={actDesc}
                                    onChange={(e) => setActDesc(e.target.value)}
                                    rows={3}
                                    data-testid="act-desc"
                                    className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 py-2.5 text-sm font-normal text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]"
                                />
                            </label>
                            {actError && (
                                <p role="alert" className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-300">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {actError}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={addActuator}
                                data-testid="act-add"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t("instructor.simulator.scannerLab.systems.modal.add")}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
