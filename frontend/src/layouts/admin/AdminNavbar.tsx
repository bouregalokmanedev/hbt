import { Menu, ShieldCheck } from "lucide-react";

export function AdminNavbar({ onMenuClick }: { onMenuClick(): void }) {
    return <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-[#3A3A3A]/8 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8"><button type="button" onClick={onMenuClick} aria-label="Open administration navigation" className="grid h-10 w-10 place-items-center rounded-xl text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A]/5 lg:hidden"><Menu className="h-5 w-5" /></button><div className="ml-auto flex items-center gap-2 rounded-full bg-[#F47822]/9 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#F47822]"><ShieldCheck className="h-3.5 w-3.5" />Secure admin area</div></header>;
}
