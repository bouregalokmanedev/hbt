import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Mail, ShieldCheck, Smartphone } from "lucide-react";

import {
  settingsApi,
  type SettingsGroup,
} from "@/features/settings/api/settings.api";

type Method = "email" | "phone";

export function TwoFactorCard() {
  const { t } = useTranslation();
  const [security, setSecurity] = useState<SettingsGroup | null>(null);
  const [method, setMethod] = useState<Method>("email");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void settingsApi
      .security()
      .then(setSecurity)
      .catch(() => setError(t("settingsPage.security.loadFail")));
  }, [t]);

  const enable = async () => {
    try {
      setError(null);
      setMessage(null);
      await settingsApi.enableTwoFactor(method);
      setCodeSent(true);
      setMessage(
        method === "phone"
          ? t("settingsPage.security.codeSentPhone")
          : t("settingsPage.security.codeSentEmail"),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("settingsPage.security.beginFail"),
      );
    }
  };

  const verify = async () => {
    try {
      setError(null);
      const next = await settingsApi.verifyTwoFactor(code, method);
      setSecurity(next);
      setCode("");
      setCodeSent(false);
      setMessage(t("settingsPage.security.enabledMsg"));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("settingsPage.security.verifyFail"),
      );
    }
  };

  const openDisableConfirm = () => {
    setError(null);
    setMessage(null);
    setDisablePassword("");
    setConfirmDisable(true);
  };

  const cancelDisable = () => {
    setConfirmDisable(false);
    setDisablePassword("");
    setError(null);
  };

  const disable = async () => {
    if (!disablePassword) {
      setError(t("settingsPage.security.disablePasswordRequired"));
      return;
    }
    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      const next = await settingsApi.disableTwoFactor(disablePassword);
      setSecurity(next);
      setCodeSent(false);
      setCode("");
      setDisablePassword("");
      setConfirmDisable(false);
      setMessage(t("settingsPage.security.disabledMsg"));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("settingsPage.security.disableFail"),
      );
    } finally {
      setBusy(false);
    }
  };

  const enabled = Boolean(security?.two_factor_enabled);

  return (
    <section
      data-testid="two-factor-card"
      className="relative overflow-hidden rounded-3xl border border-[#F47822]/15 bg-white p-5 shadow-[0_10px_28px_rgba(58,58,58,.04)] sm:p-6"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#F47822]/10 blur-3xl" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
              {t("settingsPage.security.protection")}
            </p>
            <h3 className="mt-1 font-bold text-[#3A3A3A]">{t("settingsPage.security.twoFa")}</h3>
            <p className="mt-1 text-xs text-[#3A3A3A]/55">{t("settingsPage.security.chooseDelivery")}</p>
          </div>
        </div>
        <span
          data-testid="two-factor-status"
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
            enabled
              ? "bg-emerald-100 text-emerald-700"
              : "bg-[#3A3A3A]/8 text-[#3A3A3A]/50"
          }`}
        >
          {enabled ? t("settingsPage.security.enabled") : t("settingsPage.security.notEnabled")}
        </span>
      </div>

      {enabled ? (
        confirmDisable ? (
          <div
            data-testid="two-factor-disable-confirm"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50/70 p-4"
          >
            <p className="text-xs font-bold text-red-700">{t("settingsPage.security.disableConfirmTitle")}</p>
            <p className="mt-1 text-[11px] leading-4 text-red-700/80">
              {t("settingsPage.security.disableConfirmDesc")}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block min-w-[200px] flex-1 text-xs font-semibold text-[#3A3A3A]">
                {t("settingsPage.security.currentPassword")}
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(event) => setDisablePassword(event.target.value)}
                  autoComplete="current-password"
                  data-testid="two-factor-disable-password"
                  className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-sm outline-none focus:border-[#F47822]"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="two-factor-disable-cancel"
                  onClick={cancelDisable}
                  className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 text-xs font-bold text-[#3A3A3A]/60 hover:bg-[#F3F3F3]"
                >
                  {t("settingsPage.security.disableCancel")}
                </button>
                <button
                  type="button"
                  data-testid="two-factor-disable-submit"
                  disabled={busy || !disablePassword}
                  onClick={() => void disable()}
                  className="h-11 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(220,38,38,.18)] disabled:opacity-50"
                >
                  {busy ? t("settingsPage.security.disabling") : t("settingsPage.security.confirmDisable")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <Check className="h-4 w-4" />
              {t("settingsPage.security.protectedWith", {
                method:
                  String(security?.two_factor_method ?? "email") === "phone"
                    ? t("settingsPage.security.sms")
                    : t("settingsPage.security.email"),
              })}
            </p>
            <button
              type="button"
              data-testid="two-factor-disable"
              onClick={openDisableConfirm}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
            >
              {t("settingsPage.security.disable")}
            </button>
          </div>
        )
      ) : (
        <div className="mt-5">
          {codeSent ? (
            <div
              data-testid="two-factor-code"
              className="rounded-2xl border border-[#F47822]/15 bg-[#F47822]/[.035] p-4"
            >
              <p className="text-xs font-semibold text-[#3A3A3A]">
                {t("settingsPage.security.enterCode", {
                  target:
                    method === "phone"
                      ? t("settingsPage.security.sms").toLowerCase()
                      : t("settingsPage.security.email").toLowerCase(),
                })}
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="block text-xs font-semibold text-[#3A3A3A]">
                  {t("settingsPage.security.codeLabel")}
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    data-testid="two-factor-code-input"
                    className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#F47822]"
                  />
                </label>
                <button
                  type="button"
                  data-testid="two-factor-verify"
                  onClick={() => void verify()}
                  className="h-11 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)]"
                >
                  {t("settingsPage.security.verifyEnable")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  data-testid="two-factor-method-email"
                  onClick={() => setMethod("email")}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    method === "email"
                      ? "border-[#F47822] bg-[#F47822]/[.045]"
                      : "border-[#3A3A3A]/10 hover:border-[#F47822]/35"
                  }`}
                >
                  <Mail className="h-5 w-5 text-[#F47822]" />
                  <span>
                    <span className="block text-xs font-bold text-[#3A3A3A]">
                      {t("settingsPage.security.emailCode")}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45">
                      {t("settingsPage.security.emailCodeDesc")}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  data-testid="two-factor-method-phone"
                  onClick={() => setMethod("phone")}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    method === "phone"
                      ? "border-[#F47822] bg-[#F47822]/[.045]"
                      : "border-[#3A3A3A]/10 hover:border-[#F47822]/35"
                  }`}
                >
                  <Smartphone className="h-5 w-5 text-[#F47822]" />
                  <span>
                    <span className="block text-xs font-bold text-[#3A3A3A]">
                      {t("settingsPage.security.smsCode")}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45">
                      {t("settingsPage.security.smsCodeDesc")}
                    </span>
                  </span>
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] leading-4 text-[#3A3A3A]/45">
                  {method === "phone"
                    ? t("settingsPage.security.smsRequires")
                    : t("settingsPage.security.emailCodes")}
                </p>
                <button
                  type="button"
                  data-testid="two-factor-enable"
                  onClick={() => void enable()}
                  className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)]"
                >
                  {t("settingsPage.security.sendCode")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {message && (
        <p data-testid="two-factor-message" className="mt-4 text-xs font-semibold text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p data-testid="two-factor-error" className="mt-4 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
