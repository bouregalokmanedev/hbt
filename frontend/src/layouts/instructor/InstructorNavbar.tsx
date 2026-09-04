import { Home, Menu } from "lucide-react";
import { Link } from "react-router-dom";

interface InstructorNavbarProps {
  onMenuClick: () => void;
}

export function InstructorNavbar({ onMenuClick }: InstructorNavbarProps) {
  return (
    <header
      className="
            sticky
            top-0
            z-30
            flex
            h-[72px]
            items-center
            border-b
            border-[#3A3A3A]/8
            bg-white/85
            px-4
            backdrop-blur-xl
            sm:px-6
            lg:px-8
        "
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    text-[#3A3A3A]/60
                    transition
                    hover:bg-[#3A3A3A]/5
                    lg:hidden
                "
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/"
          aria-label="Go to home page"
          className="grid h-9 w-9 place-items-center rounded-xl border border-[#F47822]/18 bg-[#FFF8F4] text-[#F47822] transition hover:-translate-y-0.5 hover:bg-[#F47822] hover:text-white"
        >
          <Home className="h-4 w-4" />
        </Link>
        <span
          className="
                    rounded-full
                    bg-[#F47822]/10
                    px-3
                    py-1.5
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-[#F47822]
                "
        >
          Instructor
        </span>
      </div>
    </header>
  );
}
