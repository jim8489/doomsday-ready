
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function DashboardLayout() {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090d] text-zinc-100">
      <Sidebar
        open={navigationOpen}
        onClose={() => setNavigationOpen(false)}
      />

      <div className="min-h-screen lg:pl-[272px]">
        <Header
          onOpenNavigation={() => setNavigationOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-7 sm:py-10 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
