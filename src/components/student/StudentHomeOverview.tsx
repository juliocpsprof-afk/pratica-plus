"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session/session.client";
import {
  getStudentByProfileId,
  getStudentSimulationHistory,
  StudentByProfile,
  StudentSimulationHistoryRow,
} from "@/services/simulation.service";

function ActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-black text-[#08213f]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </Link>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-[#08213f]">
        {value}
      </p>
    </div>
  );
}

export function StudentHomeOverview() {
  const [student, setStudent] = useState<StudentByProfile | null>(null);
  const [history, setHistory] = useState<StudentSimulationHistoryRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const averageScore = history.length
    ? Math.round(history.reduce((sum, item) => sum + item.total_score, 0) / history.length)
    : 0;

  const bestScore = history.length
    ? Math.max(...history.map((item) => item.total_score))
    : 0;

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const session = getSession() as any;
      const profileId = session?.profileId ?? session?.id;

      if (!profileId) {
        setError("Sessão do aluno não encontrada.");
        return;
      }

      const studentData = await getStudentByProfileId(profileId);

      if (!studentData) {
        setError("Cadastro de aluno não encontrado.");
        return;
      }

      const historyData = await getStudentSimulationHistory(studentData.id);

      setStudent(studentData);
      setHistory(historyData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar sua área."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
        Carregando sua área...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {student && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Minha jornada
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Seu treino profissional
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Continue praticando atendimento, vendas e tomada de decisão profissional.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                {student.simulation_access_mode === "trilha" ? "Modo Trilha" : "Modo Livre"}
              </span>

              {student.simulation_access_mode === "trilha" && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  Nível {student.trail_unlocked_level}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StatCard label="Práticas feitas" value={history.length} />
            <StatCard label="Média" value={averageScore} />
            <StatCard label="Melhor nota" value={bestScore} />
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard
          href="/aluno/atividades"
          title="Minhas atividades"
          description="Veja práticas enviadas pelo professor, prazos e resultados."
          icon="🗓️"
        />

        <ActionCard
          href="/aluno/simulacoes"
          title="Praticar agora"
          description="Escolha Telemarketing, Vendas ou prática em equipe."
          icon="💬"
        />

        <ActionCard
          href="/aluno/historico"
          title="Ver histórico"
          description="Acompanhe suas notas e simulações concluídas."
          icon="📊"
        />

        <ActionCard
          href="/aluno/simulacoes/equipe"
          title="Treino em equipe"
          description="Participe das equipes criadas pelo professor."
          icon="🤝"
        />
      </section>
    </section>
  );
}

