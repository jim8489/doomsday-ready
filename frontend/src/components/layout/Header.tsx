
import { Menu, Sparkles } from "lucide-react";

interface HeaderProps {
  onOpenNavigation: () => void;
}

export function Header({ onOpenNavigation }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/[0.06] bg-[#09090d]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Your MCU command center
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Plan the journey. Own the opening night.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-amber-400/10 bg-amber-400/[0.05] px-3 py-2">
        <Sparkles size={14} className="text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
          Assessment build
        </span>
      </div>
    </header>
  );
}
