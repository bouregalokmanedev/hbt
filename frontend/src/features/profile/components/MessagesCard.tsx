import {
    ArrowRight,
    MessageCircle,
} from "lucide-react";

interface MessagesCardProps {
    unreadCount?: number;
}

export function MessagesCard({
    unreadCount = 0,
}: MessagesCardProps) {
    return (
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">

            <div className="flex items-start justify-between">

                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]/10">
                        <MessageCircle className="h-4 w-4 text-[#F47822]" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[#3A3A3A]">
                            Messages
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#3A3A3A]/40">
                            Stay connected with your learning community.
                        </p>
                    </div>

                </div>

                {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F47822] px-1.5 text-[9px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}

            </div>

            {unreadCount === 0 ? (
                <div className="mt-5 rounded-xl bg-[#F7F7F7] px-4 py-5 text-center">

                    <MessageCircle className="mx-auto h-5 w-5 text-[#3A3A3A]/20" />

                    <p className="mt-2 text-xs font-semibold text-[#3A3A3A]/65">
                        No new messages
                    </p>

                    <p className="mt-1 text-[10px] text-[#3A3A3A]/35">
                        You're all caught up.
                    </p>

                </div>
            ) : (
                <button
                    type="button"
                    className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#F7F7F7] px-4 py-3 text-left transition hover:bg-[#F47822]/5"
                >
                    <span className="text-xs font-medium text-[#3A3A3A]">
                        View your messages
                    </span>

                    <ArrowRight className="h-3.5 w-3.5 text-[#3A3A3A]/35" />
                </button>
            )}

        </section>
    );
}