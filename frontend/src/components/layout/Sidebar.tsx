
import {
    Clapperboard,
    Film,
    Ticket,
    ListVideo,
    ChevronRight,
    X,
  } from "lucide-react";
  import { NavLink } from "react-router-dom";
  
  interface SidebarProps {
    open: boolean;
    onClose: () => void;
  }
  
  const navigation = [
    {
      label: "Movies",
      description: "Your collection",
      path: "/movies",
      icon: Film,
    },
    {
      label: "Rewatch Plan",
      description: "Your watch journey",
      path: "/rewatch",
      icon: ListVideo,
    },
    {
      label: "Booking",
      description: "Opening-night seats",
      path: "/booking",
      icon: Ticket,
    },
  ];
  
  export function Sidebar({ open, onClose }: SidebarProps) {
    return (
      <>
        {open && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
  
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-white/[0.07] bg-[#0c0c10] transition-transform duration-300 lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-[88px] items-center justify-between border-b border-white/[0.07] px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-black shadow-lg shadow-amber-500/10">
                <Clapperboard size={21} strokeWidth={2.2} />
              </div>
  
              <div>
                <h1 className="text-[15px] font-black tracking-[0.11em] text-white">
                  DOOMSDAY
                </h1>
                <p className="mt-0.5 text-[9px] font-bold tracking-[0.29em] text-amber-400">
                  READY
                </p>
              </div>
            </div>
  
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <X size={19} />
            </button>
          </div>
  
          <div className="px-5 pt-9">
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              Workspace
            </p>
  
            <nav className="space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
  
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                        isActive
                          ? "border border-amber-400/15 bg-amber-400/[0.08] text-amber-300"
                          : "border border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={19}
                          className={
                            isActive
                              ? "text-amber-400"
                              : "text-zinc-500 group-hover:text-zinc-200"
                          }
                        />
  
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-[10px] text-zinc-600">
                            {item.description}
                          </p>
                        </div>
  
                        {isActive && (
                          <ChevronRight
                            size={15}
                            className="text-amber-400"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
  
          <div className="mt-auto p-5">
            <div className="overflow-hidden rounded-2xl border border-amber-400/10 bg-gradient-to-br from-amber-400/[0.11] to-transparent p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                <Clapperboard size={18} />
              </div>
  
              <p className="text-sm font-bold text-zinc-100">
                The ultimate rewatch
              </p>
  
              <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                Get your collection ready for opening night.
              </p>
  
              <NavLink
                to="/rewatch"
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300"
              >
                Build your plan
                <ChevronRight size={14} />
              </NavLink>
            </div>
  
            <p className="mt-5 text-center text-[10px] tracking-wide text-zinc-700">
              DOOMSDAY READY · 2027
            </p>
          </div>
        </aside>
      </>
    );
  }
  