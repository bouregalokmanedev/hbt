import { Archive, BellRing, ChevronRight, MailPlus, MessageCircle, Send, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { messagesApi, type Contact, type Conversation } from "../api/messages.api";

export type MessagesMode = "messages" | "announcements";

export function MessagesPage({ mode = "messages" }: { mode?: MessagesMode }) {
    const [params, setParams] = useSearchParams();
    const [items, setItems] = useState<Conversation[]>([]);
    const [active, setActive] = useState<Conversation | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [compose, setCompose] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isAnnouncements = mode === "announcements";
    const ModeIcon = isAnnouncements ? BellRing : MessageCircle;

    const openConversation = async (id: string) => {
        const conversation = await messagesApi.get(id);
        setActive(conversation);
        await messagesApi.read(id);
        setParams({ conversation: id }, { replace: true });
    };

    const load = async () => {
        setLoading(true);
        try {
            const all = await messagesApi.list();
            const filtered = all.filter((item) => isAnnouncements ? item.type === "announcement" : item.type !== "announcement");
            setItems(filtered);
            const requested = params.get("conversation");
            if (requested && filtered.some((item) => item.id === requested)) await openConversation(requested);
            else if (filtered[0]) await openConversation(filtered[0].id);
            else setActive(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to load this inbox.");
        } finally { setLoading(false); }
    };

    useEffect(() => { void load(); }, [mode]);

    return <main className="min-h-full bg-[#F3F3F3] px-4 py-5 sm:px-7 sm:py-7">
        <div className="mx-auto max-w-[1480px]">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#F47822]">HBT communication</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] sm:text-3xl">{isAnnouncements ? "Announcements" : "Messages"}</h1>
                    <p className="mt-1 max-w-2xl text-sm text-[#3A3A3A]/55">{isAnnouncements ? "Important updates from the HBT learning team, with a private reply thread." : "Stay connected with instructors, administrators, and your learning team."}</p>
                </div>
                {!isAnnouncements && <button onClick={async () => { setCompose(true); if (!contacts.length) setContacts(await messagesApi.contacts()); }} className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F47822]"><MailPlus className="h-4 w-4" />New message</button>}
            </header>

            <nav className="mb-5 inline-flex rounded-xl border border-[#3A3A3A]/8 bg-white p-1 shadow-sm">
                <Link to="/messages" className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${!isAnnouncements ? "bg-[#F47822] text-white" : "text-[#3A3A3A]/55 hover:text-[#3A3A3A]"}`}><MessageCircle className="h-3.5 w-3.5" />Messages</Link>
                <Link to="/announcements" className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${isAnnouncements ? "bg-[#F47822] text-white" : "text-[#3A3A3A]/55 hover:text-[#3A3A3A]"}`}><BellRing className="h-3.5 w-3.5" />Announcements</Link>
            </nav>

            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div> : <div className="grid min-h-[650px] overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-white shadow-[0_18px_48px_rgba(58,58,58,.07)] lg:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="border-b border-[#3A3A3A]/8 bg-[#FCFCFC] lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between border-b border-[#3A3A3A]/8 px-5 py-5"><div><p className="text-sm font-bold text-[#3A3A3A]">{isAnnouncements ? "Updates" : "Inbox"}</p><p className="mt-1 text-[11px] text-[#3A3A3A]/45">{items.length} item{items.length === 1 ? "" : "s"}</p></div><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822]"><ModeIcon className="h-4 w-4" /></span></div>
                    {loading ? <p className="p-6 text-xs text-[#3A3A3A]/45">Loading…</p> : items.length === 0 ? <div className="p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]"><ModeIcon className="h-5 w-5" /></span><p className="mt-4 text-sm font-semibold text-[#3A3A3A]">{isAnnouncements ? "No announcements yet" : "Your inbox is clear"}</p><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50">{isAnnouncements ? "Important platform updates will appear here." : "Messages from your learning team will appear here."}</p></div> : <div className="max-h-[590px] overflow-y-auto">{items.map((conversation) => <button key={conversation.id} onClick={() => void openConversation(conversation.id)} className={`group flex w-full gap-3 border-b border-[#3A3A3A]/6 border-s-2 px-5 py-4 text-left transition hover:bg-[#F47822]/[.035] ${active?.id === conversation.id ? "border-s-[#F47822] bg-white shadow-[inset_0_0_0_1px_rgba(244,120,34,.08)]" : "border-s-transparent"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isAnnouncements ? "bg-[#F47822]/12 text-[#F47822]" : "bg-[#3A3A3A]/7 text-[#3A3A3A]/60"}`}><ModeIcon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><b className="truncate text-xs text-[#3A3A3A]">{conversation.subject || conversation.participant?.name || "Conversation"}</b><ChevronRight className="h-3.5 w-3.5 text-[#3A3A3A]/25 transition group-hover:translate-x-0.5" /></span><span className="mt-1 block truncate text-[11px] text-[#3A3A3A]/45">{isAnnouncements ? "HBT administration" : conversation.participant?.role || "Direct message"}</span></span></button>)}</div>}
                </aside>
                <section className="flex min-h-[500px] flex-col">
                    <div className="flex items-center justify-between border-b border-[#3A3A3A]/8 px-5 py-4 sm:px-6">{active ? <div className="min-w-0"><p className="truncate text-sm font-bold text-[#3A3A3A]">{active.subject || active.participant?.name || "Message"}</p><p className="mt-1 text-[11px] text-[#3A3A3A]/45">{isAnnouncements ? "Private thread with HBT administration" : `Conversation with ${active.participant?.name ?? "your learning team"}`}</p></div> : <p className="text-sm font-semibold text-[#3A3A3A]/50">Select an item to read it</p>}{active?.status === "active" && <button onClick={async () => { await messagesApi.archive(active.id); await load(); }} className="rounded-lg p-2 text-[#3A3A3A]/40 transition hover:bg-red-50 hover:text-red-600" aria-label="Archive conversation"><Archive className="h-4 w-4" /></button>}</div>
                    {active ? <Thread active={active} onSent={async () => { await openConversation(active.id); await load(); }} /> : <div className="flex flex-1 items-center justify-center p-8 text-center"><div><UserRound className="mx-auto h-8 w-8 text-[#F47822]/40" /><p className="mt-3 text-sm font-semibold text-[#3A3A3A]/60">Choose a conversation to read it</p></div></div>}
                </section>
            </div>}
            {compose && <Compose contacts={contacts} onClose={() => setCompose(false)} onCreated={async (conversation) => { setCompose(false); await load(); await openConversation(conversation.id); }} />}
        </div>
    </main>;
}

export function AnnouncementsPage() { return <MessagesPage mode="announcements" />; }

function Thread({ active, onSent }: { active: Conversation; onSent: () => Promise<void> }) {
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const send = async (value = body, type: "text" | "quick_reply" = "text") => { if (!value.trim() || sending) return; setSending(true); try { await messagesApi.send(active.id, value, type); setBody(""); await onSent(); } finally { setSending(false); } };
    return <><div className="flex-1 space-y-5 overflow-y-auto bg-[#FCFCFC] p-5 sm:p-7">{active.messages?.map((message) => { const incoming = message.sender?.id === active.participant?.id; return <article key={message.id} className={`flex ${incoming ? "justify-start" : "justify-end"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${incoming ? "rounded-bl-md border border-[#3A3A3A]/8 bg-white text-[#3A3A3A]/80" : "rounded-br-md bg-[#3A3A3A] text-white"}`}><p className="mb-1 text-[10px] font-bold uppercase tracking-[.11em] opacity-55">{message.sender?.name || "HBT"}</p><p className="whitespace-pre-wrap">{message.body}</p><time className="mt-2 block text-[9px] opacity-45">{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))}</time></div></article>; })}</div>{active.replies_enabled && active.status === "active" ? <footer className="border-t border-[#3A3A3A]/8 bg-white p-4 sm:p-5">{active.quick_replies.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{active.quick_replies.map((reply) => <button key={reply} onClick={() => void send(reply, "quick_reply")} className="rounded-full border border-[#F47822]/20 bg-[#F47822]/[.04] px-3 py-1.5 text-[11px] font-semibold text-[#F47822] transition hover:-translate-y-0.5 hover:bg-[#F47822] hover:text-white">{reply}</button>)}</div>}<div className="flex items-end gap-2 rounded-2xl border border-[#3A3A3A]/10 bg-[#FAFAFA] p-2 transition focus-within:border-[#F47822]/45 focus-within:bg-white"><textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} placeholder="Write a reply…" className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#3A3A3A]/35" /><button disabled={!body.trim() || sending} onClick={() => void send()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822] text-white transition hover:bg-[#df6817] disabled:opacity-40"><Send className="h-4 w-4" /></button></div></footer> : <div className="border-t border-[#3A3A3A]/8 bg-[#FAFAFA] px-5 py-4 text-xs text-[#3A3A3A]/45">Replies are not enabled for this announcement.</div>}</>;
}

function Compose({ contacts, onClose, onCreated }: { contacts: Contact[]; onClose: () => void; onCreated: (conversation: Conversation) => Promise<void> }) {
    const [recipient, setRecipient] = useState(contacts[0]?.id ?? ""); const [subject, setSubject] = useState(""); const [message, setMessage] = useState(""); const [sending, setSending] = useState(false);
    return <div className="fixed inset-0 z-50 grid place-items-center bg-[#17202b]/35 p-4 backdrop-blur-sm"><form onSubmit={async (event) => { event.preventDefault(); setSending(true); try { await onCreated(await messagesApi.create({ recipient_id: recipient, subject, message })); } finally { setSending(false); } }} className="w-full max-w-md rounded-[28px] border border-[#3A3A3A]/10 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">New conversation</p><h2 className="mt-1 text-lg font-bold text-[#3A3A3A]">Contact your learning team</h2></div><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-bold text-[#3A3A3A]/45">Close</button></div><label className="mt-5 block text-xs font-semibold text-[#3A3A3A]">Recipient<select value={recipient} onChange={(event) => setRecipient(event.target.value)} required className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FAFAFA] px-3 text-sm font-normal"><option value="">Choose a recipient</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role}</option>)}</select></label><label className="mt-4 block text-xs font-semibold text-[#3A3A3A]">Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FAFAFA] px-3 text-sm font-normal" placeholder="What can we help with?" /></label><label className="mt-4 block text-xs font-semibold text-[#3A3A3A]">Message<textarea required value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="mt-1.5 w-full resize-none rounded-xl border border-[#3A3A3A]/12 bg-[#FAFAFA] p-3 text-sm font-normal" placeholder="Write your message…" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/60">Cancel</button><button disabled={!recipient || !message.trim() || sending} className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{sending ? "Sending…" : "Send message"}</button></div></form></div>;
}
