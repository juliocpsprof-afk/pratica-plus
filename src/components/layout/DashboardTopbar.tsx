"use client";

import type { AppSession } from "@/lib/session/session.client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearSession,
  getSession,
} from "@/lib/session/session.client";

type DashboardTopbarProps = {
  area: "professor" | "aluno";
};

export function DashboardTopbar({ area }: DashboardTopbarProps) {
  const [session, setSession] = useState<AppSession | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  function handleLogout() {
    clearSession();
    window.location.href = "/login";
  }

  const homeHref = area === "professor" ? "/professor" : "/aluno";
  const areaLabel = area === "professor" ? "Professor" : "Aluno";

  return (
    <header className="mb-6 rounded-[24px] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href={homeHref} className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#08213f] text-sm font-black text-white">
            P+
          </div>

          <div>
            <p className="text-sm font-black text-[#08213f]">Prática+</p>
            <p className="text-xs font-bold text-slate-500">
              Área do {areaLabel}
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {session && (
            <div className="rounded-2xl bg-slate-50 px-4 py-2">
              <p className="text-xs font-bold text-slate-500">Sessão ativa</p>
              <p className="max-w-[220px] truncate text-sm font-black text-[#08213f]">
                {session.fullName}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Link href={homeHref} className="app-button-secondary px-4 py-2 text-xs">
              Início
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

