import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { supportApi } from "../api/support.api";

export function SupportThread({
  ticketId,
  onClose,
  onChanged,
}: {
  ticketId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const client = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thread = useQuery({ queryKey: ["support", "ticket", ticketId], queryFn: () => supportApi.detail(ticketId) });

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await supportApi.reply(ticketId, draft.trim());
      setDraft("");
      await client.invalidateQueries({ queryKey: ["support", "ticket", ticketId] });
      onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("support.replyFail"));
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    setSending(true);
    try {
      await supportApi.close(ticketId);
      await client.invalidateQueries({ queryKey: ["support"] });
      onChanged();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("support.closeFail"));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-[#F47822]/25 bg-white dark:bg-[#1b1b20] shadow-[0_12px_35px_rgba(244,120,34,0.10)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#3A3A3A]/8 dark:border-white/8 bg-[#F47822]/5 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("support.threadTag")}</p>
          <h2 className="mt-0.5 truncate text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">{thread.data?.subject ?? t("support.loading")}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("support.closeConv")}
          className="rounded-lg p-1.5 text-[#3A3A3A]/45 dark:text-white/45 transition hover:bg-white dark:hover:bg-[#1b1b20] hover:text-[#3A3A3A] dark:hover:text-[#ececef]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[420px] space-y-2.5 overflow-y-auto p-5">
        {thread.isLoading && <p className="text-sm text-[#3A3A3A]/50 dark:text-white/50">{t("support.loadingConv")}</p>}
        {thread.data?.replies.map((reply) => {
          const mine = user != null && reply.author_uuid != null && reply.author_uuid === user.id;
          return (
            <div key={reply.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  mine ? "bg-[#3A3A3A] text-white" : "bg-[#F7F7F7] dark:bg-[#101013] text-[#3A3A3A] dark:text-[#ececef]"
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-[.1em] ${mine ? "text-white/50" : "text-[#F47822]"}`}>
                  {mine ? t("support.you") : (reply.author ?? t("support.supportFallback"))}
                </p>
                <p className="mt-1 whitespace-pre-line text-xs leading-5">{reply.body ?? ""}</p>
                <p className={`mt-1.5 text-[10px] ${mine ? "text-white/40" : "text-[#3A3A3A]/40 dark:text-white/40"}`}>
                  {reply.created_at ? new Date(reply.created_at).toLocaleString() : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mx-5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {thread.data && thread.data.status !== "closed" ? (
        <div className="border-t border-[#3A3A3A]/8 dark:border-white/8 p-4">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void send();
              }}
              placeholder={t("support.replyPh")}
              className="h-11 min-w-0 flex-1 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] px-4 text-sm outline-none transition focus:border-[#F47822]"
            />
            <button
              type="button"
              disabled={sending || !draft.trim()}
              onClick={() => void send()}
              aria-label={t("support.sendReply")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F47822] text-white transition hover:bg-[#E96D18] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => void closeTicket()}
            className="mt-2.5 text-[11px] font-bold text-[#3A3A3A]/45 dark:text-white/45 transition hover:text-red-600 dark:hover:text-red-400"
          >
            {t("support.closeTicket")}
          </button>
        </div>
      ) : (
        thread.data && (
          <p className="border-t border-[#3A3A3A]/8 dark:border-white/8 p-4 text-center text-xs font-semibold text-[#3A3A3A]/45 dark:text-white/45">
            {t("support.closedMsg")}
          </p>
        )
      )}
    </section>
  );
}
