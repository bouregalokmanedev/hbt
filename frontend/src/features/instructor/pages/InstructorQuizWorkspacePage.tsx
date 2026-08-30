import {
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Clock3,
    LoaderCircle,
    Plus,
    Save,
    Settings2,
    Trash2,
} from "lucide-react";
import {
    FormEvent,
    useState,
} from "react";
import {
    Link,
    useParams,
} from "react-router-dom";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import type {
    InstructorQuiz,
    InstructorQuizQuestion,
} from "../types/instructor";
import {
    createInstructorQuiz,
    createInstructorQuizOption,
    createInstructorQuizQuestion,
    deleteInstructorQuiz,
    deleteInstructorQuizOption,
    deleteInstructorQuizQuestion,
    getInstructorCurriculum,
    getInstructorQuizzes,
    runInstructorQuizAction,
    updateInstructorQuiz,
    updateInstructorQuizOption,
    updateInstructorQuizQuestion,
} from "../api/instructorApi";

function slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function InstructorQuizWorkspacePage() {
    const { courseId } = useParams();
    const queryClient = useQueryClient();
    const [sectionId, setSectionId] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    const curriculum = useQuery({ queryKey: ["instructor", "curriculum", courseId], queryFn: () => getInstructorCurriculum(courseId!), enabled: Boolean(courseId) });
    const quizzes = useQuery({ queryKey: ["instructor", "quizzes", courseId], queryFn: () => getInstructorQuizzes(courseId!), enabled: Boolean(courseId) });

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ["instructor", "quizzes", courseId] });
        await queryClient.invalidateQueries({ queryKey: ["instructor", "curriculum", courseId] });
    };

    const create = useMutation({
        mutationFn: () => createInstructorQuiz(courseId!, { section_id: sectionId, title, slug: slugify(title) }),
        onSuccess: async () => { setTitle(""); setMessage("Quiz draft created. Add questions before publishing."); await refresh(); },
        onError: () => setMessage("Select a section and give the quiz a title."),
    });

    if (curriculum.isLoading || quizzes.isLoading) return <WorkspaceSkeleton />;
    if (curriculum.isError || quizzes.isError || !curriculum.data || !quizzes.data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">Unable to load your quiz workspace.</div>;

    return <div className="mx-auto max-w-5xl space-y-6">
        <header><Link to={`/instructor/courses/${courseId}/curriculum`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 hover:text-[#F47822]"><ArrowLeft className="h-3.5 w-3.5" /> Curriculum builder</Link><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">Assessment design</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">Quiz checkpoints</h1><p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50">Create section-level knowledge checks that keep learners moving forward with confidence.</p></header>
        {message && <div className="rounded-xl border border-[#F47822]/20 bg-[#F47822]/8 px-4 py-3 text-sm text-[#9c4209]">{message}</div>}

        <form onSubmit={(event) => { event.preventDefault(); if (sectionId && title.trim()) create.mutate(); }} className="grid gap-3 rounded-2xl border border-[#F47822]/20 bg-[#F47822]/5 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end"><label><span className="text-xs font-bold text-[#3A3A3A]">Attach to section</span><select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822]"><option value="">Choose a section</option>{curriculum.data.sections.map((section) => <option key={section.id} value={section.id}>{section.position}. {section.title}</option>)}</select></label><label><span className="text-xs font-bold text-[#3A3A3A]">Quiz title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. CAN network checkpoint" className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822]" /></label><button disabled={create.isPending || !sectionId || !title.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white hover:bg-[#de6414] disabled:opacity-50">{create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create quiz</button></form>

        {quizzes.data.length === 0 ? <EmptyQuizzes /> : <div className="space-y-4">{quizzes.data.map((quiz) => <QuizEditor key={quiz.id} quiz={quiz} sectionName={curriculum.data.sections.find((section) => section.id === quiz.section_id)?.title ?? "Section"} onChanged={refresh} onMessage={setMessage} />)}</div>}
    </div>;
}

function QuizEditor({ quiz, sectionName, onChanged, onMessage }: { quiz: InstructorQuiz; sectionName: string; onChanged: () => Promise<void>; onMessage: (message: string) => void }) {
    const [open, setOpen] = useState(true);
    const [title, setTitle] = useState(quiz.title);
    const [description, setDescription] = useState(quiz.description ?? "");
    const [passPercentage, setPassPercentage] = useState(String(quiz.pass_percentage));
    const [timeLimit, setTimeLimit] = useState(quiz.time_limit === null ? "" : String(quiz.time_limit));
    const [maxAttempts, setMaxAttempts] = useState(quiz.max_attempts === null ? "" : String(quiz.max_attempts));
    const [newQuestion, setNewQuestion] = useState("");
    const [working, setWorking] = useState(false);

    const run = async (action: () => Promise<void>, success?: string) => { try { setWorking(true); await action(); if (success) onMessage(success); await onChanged(); } catch { onMessage("That quiz action couldn't be completed. Check the quiz requirements and try again."); } finally { setWorking(false); } };

    return <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,.04)]"><div className="flex items-center gap-3 px-5 py-4"><ClipboardCheck className="h-5 w-5 shrink-0 text-[#F47822]" /><button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#F47822]">{sectionName}</p><h2 className="mt-1 truncate font-semibold text-[#3A3A3A]">{quiz.title}</h2></button><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${quiz.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{quiz.status}</span><button type="button" onClick={() => setOpen((value) => !value)} className="p-1 text-[#3A3A3A]/45">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></div>
        {open && <div className="border-t border-[#3A3A3A]/7 p-5"><div className="grid gap-4 sm:grid-cols-2"><Text label="Quiz title" value={title} onChange={setTitle} /><Text label="Description" value={description} onChange={setDescription} /><Text label="Passing score (%)" value={passPercentage} type="number" onChange={setPassPercentage} /><Text label="Time limit (minutes)" value={timeLimit} type="number" placeholder="No limit" onChange={setTimeLimit} /><Text label="Attempts allowed" value={maxAttempts} type="number" placeholder="Unlimited" onChange={setMaxAttempts} /></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={working} onClick={() => void run(() => updateInstructorQuiz(quiz.id, { title, slug: slugify(title), description: description || null, pass_percentage: Number(passPercentage), time_limit: timeLimit === "" ? null : Number(timeLimit), max_attempts: maxAttempts === "" ? null : Number(maxAttempts) }), "Quiz settings saved.")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#F47822]"><Save className="h-3.5 w-3.5" /> Save settings</button><button type="button" disabled={working} onClick={() => void run(() => runInstructorQuizAction(quiz.id, quiz.status === "published" ? "unpublish" : "publish"), quiz.status === "published" ? "Quiz returned to draft." : "Quiz published.")} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#F47822]/25 px-3 py-2 text-[11px] font-bold text-[#F47822]">{quiz.status === "published" ? <Settings2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{quiz.status === "published" ? "Unpublish" : "Publish quiz"}</button><button type="button" disabled={working} onClick={() => { if (window.confirm(`Delete “${quiz.title}”?`)) void run(() => deleteInstructorQuiz(quiz.id)); }} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button></div>
            <div className="mt-6 border-t border-[#3A3A3A]/7 pt-5"><div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-[.13em] text-[#3A3A3A]/50">Questions · {quiz.questions.length}</h3><span className="inline-flex items-center gap-1 text-[11px] text-[#3A3A3A]/45"><Clock3 className="h-3.5 w-3.5" /> {quiz.time_limit ? `${quiz.time_limit} min` : "No time limit"}</span></div><div className="mt-3 space-y-3">{quiz.questions.map((question) => <QuestionEditor key={question.id} question={question} onChanged={onChanged} onMessage={onMessage} />)}</div><form onSubmit={(event) => { event.preventDefault(); if (newQuestion.trim()) void run(async () => { await createInstructorQuizQuestion(quiz.id, { question: newQuestion, type: "single_choice" }); setNewQuestion(""); }); }} className="mt-4 flex gap-2"><input value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} placeholder="Add a question" className="h-10 min-w-0 flex-1 rounded-lg border border-dashed border-[#3A3A3A]/18 px-3 text-sm outline-none focus:border-[#F47822]" /><button disabled={working || !newQuestion.trim()} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#F47822]/10 px-3 text-xs font-bold text-[#F47822] hover:bg-[#F47822] hover:text-white"><Plus className="h-3.5 w-3.5" /> Add</button></form></div>
        </div>}
    </section>;
}

function QuestionEditor({ question, onChanged, onMessage }: { question: InstructorQuizQuestion; onChanged: () => Promise<void>; onMessage: (message: string) => void }) {
    const [text, setText] = useState(question.question);
    const [type, setType] = useState(question.type);
    const [points, setPoints] = useState(String(question.points));
    const [option, setOption] = useState("");
    const [working, setWorking] = useState(false);
    const run = async (action: () => Promise<void>) => { try { setWorking(true); await action(); await onChanged(); } catch { onMessage("That question change couldn't be saved."); } finally { setWorking(false); } };
    return <article className="rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-3.5"><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_75px]"><input value={text} onChange={(event) => setText(event.target.value)} className="h-10 rounded-lg border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822]" /><select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-lg border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822]"><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="true_false">True / False</option></select><input value={points} type="number" min="1" onChange={(event) => setPoints(event.target.value)} className="h-10 rounded-lg border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822]" /></div><div className="mt-2 flex gap-2"><button type="button" disabled={working} onClick={() => void run(() => updateInstructorQuizQuestion(question.id, { question: text, type, points: Number(points) }))} className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#F47822] hover:bg-[#F47822]/10">Save question</button><button type="button" disabled={working} onClick={() => { if (window.confirm("Delete this question?")) void run(() => deleteInstructorQuizQuestion(question.id)); }} className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50">Delete</button></div><div className="mt-3 space-y-1.5">{question.options.map((choice) => <label key={choice.id} className="flex items-center gap-2 rounded-lg border border-[#3A3A3A]/7 bg-white px-2.5 py-2"><input type="checkbox" checked={choice.is_correct} onChange={(event) => void run(() => updateInstructorQuizOption(choice.id, { is_correct: event.target.checked }))} className="h-3.5 w-3.5 accent-[#F47822]" /><span className="min-w-0 flex-1 truncate text-xs text-[#3A3A3A]">{choice.option}</span><button type="button" onClick={() => void run(() => deleteInstructorQuizOption(choice.id))} className="text-[#3A3A3A]/35 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></label>)}</div><form onSubmit={(event) => { event.preventDefault(); if (option.trim()) void run(async () => { await createInstructorQuizOption(question.id, { option }); setOption(""); }); }} className="mt-2 flex gap-2"><input value={option} onChange={(event) => setOption(event.target.value)} placeholder="Add an answer option" className="h-9 min-w-0 flex-1 rounded-lg border border-dashed border-[#3A3A3A]/18 bg-white px-2.5 text-xs outline-none focus:border-[#F47822]" /><button disabled={working || !option.trim()} className="h-9 rounded-lg px-2.5 text-xs font-bold text-[#F47822] hover:bg-[#F47822]/10">Add option</button></form></article>;
}

function Text({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label><span className="text-[11px] font-semibold text-[#3A3A3A]/65">{label}</span><input value={value} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#3A3A3A]/10 px-3 text-sm outline-none focus:border-[#F47822]" /></label>; }
function EmptyQuizzes() { return <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-white px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><ClipboardCheck className="h-5 w-5" /></div><h2 className="mt-4 text-lg font-semibold text-[#3A3A3A]">Add your first quiz checkpoint</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50">Attach a quiz to a section, create questions and correct answers, then publish it for learners.</p></div>; }
function WorkspaceSkeleton() { return <div className="mx-auto max-w-5xl space-y-5"><div className="h-28 animate-pulse rounded-2xl bg-black/5" />{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-black/5" />)}</div>; }
