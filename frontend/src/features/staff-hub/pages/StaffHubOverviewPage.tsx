import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, Megaphone, MessageCircle, Send, Users } from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { staffHubApi, type StaffRoomMember } from "../api/staffHub.api";

interface StaffHubOverviewPageProps {
  hubBase: string;
}

const ROLE_ORDER = ["Super Admin", "Admin", "Support", "Instructor"];

function groupByRole(members: StaffRoomMember[]): { role: string; members: StaffRoomMember[] }[] {
  const buckets = new Map<string, StaffRoomMember[]>();
  for (const member of members) {
    const role = member.role ?? "Staff";
    buckets.set(role, [...(buckets.get(role) ?? []), member]);
  }
  return ROLE_ORDER.concat([...buckets.keys()].filter((role) => !ROLE_ORDER.includes(role)))
    .filter((role) => buckets.has(role))
    .map((role) => ({ role, members: buckets.get(role) ?? [] }));
}

export function StaffHubOverviewPage({ hubBase }: StaffHubOverviewPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const client = useQueryClient();

  const room = useQuery({ queryKey: ["staff-hub", "room"], queryFn: staffHubApi.getRoom });

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  const publish = useMutation({
    mutationFn: staffHubApi.publishNews,
    onSuccess: () => {
      setTitle("");
      setMessage("");
      setActionUrl("");
      void client.invalidateQueries({ queryKey: ["staff-hub"] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    publish.mutate({ title, message, action_url: actionUrl || undefined });
  };

  const members = room.data?.participants ?? [];
  const grouped = groupByRole(members);
  const myName = user ? `${user.first_name} ${user.last_name}`.trim() : "";

  return (
    <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
      <section className="rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-[0_18px_48px_rgba(58,58,58,.07)]">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822] text-white">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
              {t("staffHub.news.tag")}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">
              {t("staffHub.news.title")}
            </h2>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">
          {t("staffHub.news.hint")}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#3A3A3A]/62 dark:text-white/62">
              {t("staffHub.news.titleLabel")}
            </span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              placeholder={t("staffHub.news.titlePh")}
              className="w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-white dark:bg-[#232329] px-3.5 py-2.5 text-sm text-[#3A3A3A] dark:text-[#ececef] outline-none transition focus:border-[#F47822]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#3A3A3A]/62 dark:text-white/62">
              {t("staffHub.news.messageLabel")}
            </span>
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={5000}
              rows={5}
              placeholder={t("staffHub.news.messagePh")}
              className="w-full resize-none rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-white dark:bg-[#232329] px-3.5 py-2.5 text-sm text-[#3A3A3A] dark:text-[#ececef] outline-none transition focus:border-[#F47822]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#3A3A3A]/62 dark:text-white/62">
              {t("staffHub.news.actionLabel")}
            </span>
            <input
              value={actionUrl}
              onChange={(event) => setActionUrl(event.target.value)}
              placeholder="/support-desk"
              className="w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-white dark:bg-[#232329] px-3.5 py-2.5 text-sm text-[#3A3A3A] dark:text-[#ececef] outline-none transition focus:border-[#F47822]"
            />
          </label>

          {publish.isError && (
            <p className="text-xs font-medium text-red-600">{t("staffHub.news.sendError")}</p>
          )}
          {publish.isSuccess && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("staffHub.news.sentOk", { count: publish.data?.delivery?.delivered ?? 0 })}
            </p>
          )}

          <button
            type="submit"
            disabled={publish.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-3 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#F47822] disabled:opacity-50 dark:bg-white dark:text-[#3A3A3A] dark:hover:bg-[#F47822] dark:hover:text-white"
          >
            <Send className="h-4 w-4 rtl:-scale-x-100" />
            {publish.isPending ? t("staffHub.news.sending") : t("staffHub.news.send")}
          </button>
        </form>
      </section>

      <section className="space-y-6">
        <div className="rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-[0_18px_48px_rgba(58,58,58,.07)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#3A3A3A] text-white dark:bg-white dark:text-[#3A3A3A]">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                  {t("staffHub.roster.tag")}
                </p>
                <h2 className="mt-0.5 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                  {t("staffHub.roster.title")}
                </h2>
              </div>
            </div>
            <span className="rounded-full bg-[#F47822]/10 px-3 py-1 text-[11px] font-bold text-[#F47822]">
              {t("staffHub.roster.count", { count: members.length })}
            </span>
          </div>

          {room.isLoading && <p className="mt-4 text-xs text-[#3A3A3A]/50">{t("staffHub.roster.loading")}</p>}
          {room.isError && (
            <p className="mt-4 text-xs font-medium text-red-600">{t("staffHub.roster.error")}</p>
          )}

          <div className="mt-5 space-y-4">
            {grouped.map(({ role, members: roleMembers }) => (
              <div key={role}>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#3A3A3A]/40 dark:text-white/40">
                  {role}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {roleMembers.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#FCFCFC] dark:bg-[#232329] px-3.5 py-2.5"
                    >
                      <span className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                        {member.name}
                      </span>
                      {member.name === myName && myName !== "" && (
                        <span className="rounded-full bg-[#F47822]/12 px-2 py-0.5 text-[10px] font-bold text-[#F47822]">
                          {t("staffHub.roster.you")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to={`${hubBase}/room`}
            className="group rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-5 transition hover:border-[#F47822]/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
              <MessageCircle className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
              {t("staffHub.links.room")}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
              {t("staffHub.links.roomDesc")}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#F47822]">
              {t("staffHub.links.open")}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </span>
          </Link>

          <Link
            to={`${hubBase}/news`}
            className="group rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-5 transition hover:border-[#F47822]/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
              <Megaphone className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
              {t("staffHub.links.news")}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
              {t("staffHub.links.newsDesc")}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#F47822]">
              {t("staffHub.links.open")}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
