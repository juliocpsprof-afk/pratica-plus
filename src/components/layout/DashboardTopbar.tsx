"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getSession } from "@/lib/session/session.client";

type DashboardTopbarProps = {
  area: "professor" | "aluno";
};

export function DashboardTopbar({ area }: DashboardTopbarProps) {
  const router = useRouter();
  const session = getSession();

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[1.5rem] bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Sessão ativa
        </p>
        <p className="mt-1 text-sm font-bold text-slate-600">
          {session
            ? `${session.fullName} • ${session.role}`
            : `Área do ${area}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={area === "professor" ? "/professor" : "/aluno"}
          className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
        >
          Início da área
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
  );
}
