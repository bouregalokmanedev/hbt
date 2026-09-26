import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Award, BookOpen, Heart, MessageSquare, Pin, Send, Share2, Sparkles, Users, X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import i18n from "@/i18n";
import { sendInstructorAnnouncement } from "../api/instructorApi";

type Post = {
  id: string;
  author: string;
  role: string;
  initials: string;
  title: string;
  body: string;
  tag: string;
  likes: number;
  liked: boolean;
  comments: { id:string; author:string; body:string }[];
  createdAt: string;
};

const SEED: Post[] = [
  {
    id: "1",
    author: "Amine Diagnostics",
    role: "Senior Instructor · CAN & UDS",
    initials: "AD",
    title: "How I structure a CAN diagnostics session for beginners",
    body: "I start with live capture → identify IDs → map signals → isolate fault. Sharing my template and oscilloscope checklist. Happy to co-review your next session!",
    tag: "Teaching tip",
    likes: 12,
    liked: false,
    comments: [{id:"c1", author:"Sara H.", body:"Love the checklist — would you share the capture template?" }],
    createdAt: "2h ago",
  },
  {
    id: "2",
    author: "Nadia AutoLab",
    role: "Instructor · EV Systems",
    initials: "NA",
    title: "New EV lab: battery thermal runaway demo (safe)",
    body: "Built a low-voltage simulation for thermal monitoring. Students can trigger, observe, and diagnose without high-voltage risk. PDF + Sim file inside.",
    tag: "Resource",
    likes: 8,
    liked: false,
    comments: [],
    createdAt: "Yesterday",
  },
  {
    id: "3",
    author: "HBT Team",
    role: "Platform · Official",
    initials: "HB",
    title: "Instructor office hours — every Thursday 18:00 CET",
    body: "Bring your course drafts, get feedback from peers and admin. This week: pricing & Pro positioning.",
    tag: "Announcement",
    likes: 5,
    liked: false,
    comments: [],
    createdAt: "3 days ago",
  },
];

const STORAGE_KEY = "hbt:instructor-lounge";

function loadPosts(): Post[] {
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ const parsed = JSON.parse(raw); if(Array.isArray(parsed) && parsed.length) return parsed; }
  }catch{}
  return SEED;
}

export function InstructorLoungePage(){
  const { t, i18n: i18nHook } = useTranslation();
  const isRTL = i18nHook.language === "ar";
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(()=> loadPosts());
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState({ title:"", body:"", tag:"Teaching tip" });
  const [commentDraft, setCommentDraft] = useState<Record<string,string>>({});
  const [announceState, setAnnounceState] = useState<{ id: string; status: "sending" | "sent" | "error" } | null>(null);

  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }catch{} },[posts]);

  const tags = [
    { value: "All", label: t("instructor.lounge.tags.all") },
    { value: "Teaching tip", label: t("instructor.lounge.tags.tip") },
    { value: "Resource", label: t("instructor.lounge.tags.resource") },
    { value: "Question", label: t("instructor.lounge.tags.question") },
    { value: "Announcement", label: t("instructor.lounge.tags.announcement") },
  ];

  const tagLabel = (value: string) => tags.find((tag) => tag.value === value)?.label ?? value;

  const filtered = useMemo(()=> posts.filter(p=>{
    if(filter!=="All" && p.tag!==filter) return false;
    if(search && ! (p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }),[posts, filter, search]);

  const handleCreate = ()=>{
    if(!draft.title.trim() || !draft.body.trim()) return;
    const newPost: Post = {
      id: Date.now().toString(),
      author: `${user?.first_name ?? i18n.t("instructor.lounge.fallbackAuthor")} ${user?.last_name ?? ""}`.trim() || i18n.t("instructor.lounge.fallbackAuthor"),
      role: i18n.t("instructor.lounge.fallbackRole"),
      initials: `${(user?.first_name?.[0]??"Y")}${(user?.last_name?.[0]??"")}`.toUpperCase(),
      title: draft.title.trim(),
      body: draft.body.trim(),
      tag: draft.tag,
      likes: 0,
      liked: false,
      comments: [],
      createdAt: i18n.t("instructor.lounge.justNow"),
    };
    setPosts(p=>[newPost, ...p]);
    setDraft({ title:"", body:"", tag:"Teaching tip" });
    setShowComposer(false);
  };

  const toggleLike = (id:string)=>{
    setPosts(ps=> ps.map(p=> p.id===id ? {...p, liked: !p.liked, likes: p.liked? p.likes-1 : p.likes+1 } : p));
  };

  const addComment = (postId:string)=>{
    const body = (commentDraft[postId]??"").trim();
    if(!body) return;
    setPosts(ps=> ps.map(p=> p.id===postId ? {...p, comments: [...p.comments, { id: Date.now().toString(), author: user?.first_name ?? i18n.t("instructor.lounge.fallbackAuthor"), body }]} : p));
    setCommentDraft(d=> ({...d,[postId]:""}));
  };

  const publishAsAnnouncement = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setAnnounceState({ id: postId, status: "sending" });
    try {
      await sendInstructorAnnouncement({ title: post.title, message: post.body });
      setAnnounceState({ id: postId, status: "sent" });
    } catch {
      setAnnounceState({ id: postId, status: "error" });
    }
  };

  return (
    <main className="min-h-full bg-[#F3F3F3]">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="overflow-hidden rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white shadow-[0_14px_38px_rgba(58,58,58,0.12)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("instructor.lounge.eyebrow")}</p>
              <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]"><Users className="h-5 w-5" /></span>
                {t("instructor.lounge.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">{t("instructor.lounge.description")}</p>
              <p className="mt-3 inline-flex flex-wrap rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/70">{t("instructor.lounge.previewBefore")}<Link to="/instructor/announcements/new" className="underline">{t("instructor.lounge.previewLink")}</Link>{t("instructor.lounge.previewAfter")}</p>
            </div>
            <button type="button" onClick={()=>setShowComposer(v=>!v)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#F47822] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.18)] hover:bg-[#E96D18]">
              {showComposer ? <X className="h-4 w-4" /> : <Share2 className="h-4 w-4 rtl:-scale-x-100" />}
              {showComposer ? t("instructor.lounge.close") : t("instructor.lounge.share")}
            </button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/70"><Award className="h-3 w-3" /> {t("instructor.lounge.verified")}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/70"><BookOpen className="h-3 w-3" /> {t("instructor.lounge.peerReviewed")}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822] px-3 py-1.5 text-[10px] font-bold text-white"><Sparkles className="h-3 w-3" /> {t("instructor.lounge.qaNew")}</span>
          </div>
        </header>

        {showComposer && (
          <section className="mt-6 rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,0.05)] sm:p-6">
            <h3 className="text-sm font-bold text-[#3A3A3A]">{t("instructor.lounge.composerTitle")}</h3>
            <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("instructor.lounge.composerDesc")}</p>
            <div className="mt-4 grid gap-3">
              <input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} placeholder={t("instructor.lounge.titlePh")} className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-4 text-sm outline-none focus:border-[#F47822]" />
              <div className="flex flex-wrap gap-3">
                <select value={draft.tag} onChange={e=>setDraft(d=>({...d,tag:e.target.value}))} className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-semibold">
                  {tags.filter((tag) => tag.value !== "All").map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}
                </select>
                <span className="flex h-11 items-center rounded-xl bg-[#F47822]/10 px-3 text-xs font-bold text-[#F47822]">{t("instructor.lounge.instructorOnly")}</span>
              </div>
              <textarea value={draft.body} onChange={e=>setDraft(d=>({...d,body:e.target.value}))} rows={4} placeholder={t("instructor.lounge.bodyPh")} className="w-full resize-none rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-4 py-3 text-sm leading-6 outline-none focus:border-[#F47822] placeholder:text-[#3A3A3A]/30" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=>setShowComposer(false)} className="h-10 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-semibold text-[#3A3A3A]/60 hover:bg-[#F3F3F3]">{t("instructor.lounge.cancel")}</button>
                <button type="button" onClick={handleCreate} disabled={!draft.title.trim() || !draft.body.trim()} className="h-10 rounded-xl bg-[#F47822] px-5 text-xs font-bold text-white disabled:opacity-50">{t("instructor.lounge.publish")}</button>
              </div>
            </div>
          </section>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag=> (
              <button key={tag.value} type="button" onClick={()=>setFilter(tag.value)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${filter===tag.value ? "bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,0.18)]" : "bg-white text-[#3A3A3A]/55 hover:text-[#3A3A3A] border border-[#3A3A3A]/8"}`}>{tag.label}</button>
            ))}
          </div>
          <label className="relative">
            <SearchIcon className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/30 ${isRTL ? "right-3" : "left-3"}`} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("instructor.lounge.searchPh")} className={`h-10 w-full sm:w-64 rounded-xl border border-[#3A3A3A]/10 bg-white pr-3 text-sm outline-none focus:border-[#F47822] ${isRTL ? "pl-3 pr-9" : "pl-9"}`} />
          </label>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {filtered.map(post=> (
              <article key={post.id} className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3A3A3A] text-xs font-bold text-white">{post.initials}</div>
                    <div>
                      <p className="text-sm font-bold text-[#3A3A3A]">{post.author}</p>
                      <p className="text-[11px] text-[#3A3A3A]/45">{post.role} · {post.createdAt}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${post.tag==="Announcement" ? "bg-[#F47822] text-white" : post.tag==="Resource" ? "bg-emerald-50 text-emerald-700" : "bg-[#F47822]/10 text-[#F47822]"}`}>{tagLabel(post.tag)}</span>
                </div>
                <h3 className="mt-4 text-base font-bold leading-snug text-[#3A3A3A]">{post.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3A3A3A]/65">{post.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={()=>toggleLike(post.id)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${post.liked ? "border-[#F47822] bg-[#F47822]/10 text-[#F47822]" : "border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:border-[#F47822]/30"}`}>
                    <Heart className={`h-3.5 w-3.5 ${post.liked ? "fill-[#F47822] text-[#F47822]" : ""}`} />{post.likes} {t("instructor.lounge.helpful")}
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822]/5 px-3 py-1.5 text-xs font-semibold text-[#3A3A3A]/60"><MessageSquare className="h-3.5 w-3.5" />{t("instructor.lounge.replies", { count: post.comments.length })}</span>
                  <button
                    type="button"
                    onClick={() => void publishAsAnnouncement(post.id)}
                    disabled={announceState?.id === post.id && announceState.status === "sending"}
                    title={t("instructor.lounge.sendTitle")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#3A3A3A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
                    {announceState?.id === post.id && announceState.status === "sent"
                      ? t("instructor.lounge.sent")
                      : announceState?.id === post.id && announceState.status === "sending"
                        ? t("instructor.lounge.sending")
                        : announceState?.id === post.id && announceState.status === "error"
                          ? t("instructor.lounge.retry")
                          : t("instructor.lounge.sendToStudents")}
                  </button>
                  {post.tag!=="Announcement" && <span className="ms-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#3A3A3A]/30"><Pin className="h-3 w-3" /> {t("instructor.lounge.pinned")}</span>}
                </div>
                {post.comments.length>0 && (
                  <div className="mt-4 space-y-2 rounded-xl bg-[#FAFAFA] p-3">
                    {post.comments.map(c=> (
                      <div key={c.id} className="flex gap-2 text-xs"><span className="font-bold text-[#3A3A3A]">{c.author}:</span><span className="text-[#3A3A3A]/65">{c.body}</span></div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <input value={commentDraft[post.id]??""} onChange={e=>setCommentDraft(d=>({...d,[post.id]:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter") addComment(post.id); }} placeholder={t("instructor.lounge.replyPh")} className="h-9 min-w-0 flex-1 rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-xs outline-none focus:border-[#F47822]" />
                  <button type="button" onClick={()=>addComment(post.id)} aria-label={t("instructor.lounge.replyPh")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822] text-white hover:bg-[#E96D18]"><Send className="h-3.5 w-3.5 rtl:-scale-x-100" /></button>
                </div>
              </article>
            ))}
            {filtered.length===0 && (
              <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-white p-10 text-center">
                <p className="text-sm font-semibold text-[#3A3A3A]">{t("instructor.lounge.emptyTitle")}</p>
                <p className="mt-1 text-xs text-[#3A3A3A]/45">{t("instructor.lounge.emptyDesc")}</p>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#F47822]/15 bg-[#FFF8F4] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("instructor.lounge.guidelines")}</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-[#3A3A3A]/65">
                <li>• {t("instructor.lounge.rule1")}</li>
                <li>• {t("instructor.lounge.rule2")}</li>
                <li>• {t("instructor.lounge.rule3")}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
              <h3 className="text-sm font-bold text-[#3A3A3A]">{t("instructor.lounge.activeTitle")}</h3>
              <p className="mt-1 text-xs text-[#3A3A3A]/45">{t("instructor.lounge.activeDesc")}</p>
              <div className="mt-3 flex -space-x-2 rtl:space-x-reverse">
                {["AD","NA","HB","MK","LS"].map(i=> (
                  <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#3A3A3A] text-[10px] font-bold text-white">{i}</div>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#F47822] text-[10px] font-bold text-white">+12</div>
              </div>
            </div>
            <div className="rounded-2xl bg-[#3A3A3A] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F47822]">{t("instructor.lounge.officeEyebrow")}</p>
              <p className="mt-2 text-sm font-semibold">{t("instructor.lounge.officeTitle")}</p>
              <p className="mt-1 text-xs leading-5 text-white/60">{t("instructor.lounge.officeDesc")}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
}
