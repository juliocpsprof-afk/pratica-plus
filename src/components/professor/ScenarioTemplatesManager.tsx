"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  duplicateScenario,
  getScenarios,
  ScenarioRow,
} from "@/services/scenarios.service";

type BadgeTone = "slate" | "blue" | "green" | "amber" | "red";

function difficultyLabel(value: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";

  return value;
}

function difficultyTone(value: string): BadgeTone {
  if (value === "facil") return "green";
  if (value === "medio") return "amber";
  if (value === "dificil") return "red";

  return "slate";
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  };

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}
    >
      <span className="truncate">{children}</span>
    </span>
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

export function ScenarioTemplatesManager() {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("todos");
  const [difficultyFilter, setDifficultyFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioRow | null>(null);

  const [duplicateTitle, setDuplicateTitle] = useState("");
  const [duplicateActive, setDuplicateActive] = useState(false);

  const [createdScenarioId, setCreatedScenarioId] = useState("");
  const [createdScenarioTitle, setCreatedScenarioTitle] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const modules = useMemo(() => {
    const map = new Map<string, string>();

    for (const scenario of scenarios) {
      if (scenario.modules?.id && scenario.modules.name) {
        map.set(scenario.modules.id, scenario.modules.name);
      }
    }

    return Array.from(map.entries())
      .map(([id, name]) => ({
        id,
        name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [scenarios]);

  const filteredScenarios = useMemo(() => {
    const term = search.trim().toLowerCase();

    return scenarios.filter((scenario) => {
      const searchableText = [
        scenario.title,
        scenario.description ?? "",
        scenario.customer_name ?? "",
        scenario.customer_profile ?? "",
        scenario.modules?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);

      const matchesModule =
        moduleFilter === "todos" ||
        scenario.module_id === moduleFilter;

      const matchesDifficulty =
        difficultyFilter === "todos" ||
        scenario.difficulty === difficultyFilter;

      const matchesType =
        typeFilter === "todos" ||
        scenario.scenario_type === typeFilter;

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && scenario.is_active) ||
        (statusFilter === "inativos" && !scenario.is_active);

      return (
        matchesSearch &&
        matchesModule &&
        matchesDifficulty &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    scenarios,
    search,
    moduleFilter,
    difficultyFilter,
    typeFilter,
    statusFilter,
  ]);

  const activeCount = scenarios.filter(
    (scenario) => scenario.is_active
  ).length;

  const officialCount = scenarios.filter(
    (scenario) => scenario.scenario_type === "oficial"
  ).length;

  const customCount = scenarios.filter(
    (scenario) => scenario.scenario_type === "personalizado"
  ).length;

  async function loadScenarios() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getScenarios();

      setScenarios(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os cenários."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadScenarios();
  }, []);

  function openDuplicateModal(scenario: ScenarioRow) {
    setSelectedScenario(scenario);
    setDuplicateTitle(`${scenario.title} - Cópia`);
    setDuplicateActive(false);
    setCreatedScenarioId("");
    setCreatedScenarioTitle("");
    setError("");
    setSuccess("");
  }

  function closeDuplicateModal() {
    if (isDuplicating) {
      return;
    }

    setSelectedScenario(null);
    setDuplicateTitle("");
    setDuplicateActive(false);
  }

  async function handleDuplicate() {
    try {
      setError("");
      setSuccess("");
      setCreatedScenarioId("");
      setCreatedScenarioTitle("");

      if (!selectedScenario) {
        setError("Nenhum cenário foi selecionado.");
        return;
      }

      if (!duplicateTitle.trim()) {
        setError("Informe o título do novo cenário.");
        return;
      }

      setIsDuplicating(true);

      const duplicatedId = await duplicateScenario({
        sourceScenarioId: selectedScenario.id,
        title: duplicateTitle,
        isActive: duplicateActive,
      });

      setCreatedScenarioId(duplicatedId);
      setCreatedScenarioTitle(duplicateTitle.trim());

      setSuccess(
        duplicateActive
          ? "Cenário duplicado e publicado com sucesso."
          : "Cenário duplicado como inativo. Agora ele pode ser revisado no gerenciador."
      );

      await loadScenarios();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível duplicar o cenário."
      );
    } finally {
      setIsDuplicating(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setModuleFilter("todos");
    setDifficultyFilter("todos");
    setTypeFilter("todos");
    setStatusFilter("todos");
  }

  return (
    <>
      <section className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                  Biblioteca
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                  Modelos de cenários
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use um cenário existente como base para criar uma nova
                  variação sem reconstruir toda a conversa.
                </p>
              </div>

              <button
                type="button"
                onClick={loadScenarios}
                disabled={isLoading}
                className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Atualizando..." : "Atualizar biblioteca"}
              </button>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid gap-3 md:grid-cols-4">
              <StatCard label="Total" value={scenarios.length} />
              <StatCard label="Ativos" value={activeCount} />
              <StatCard label="Oficiais" value={officialCount} />
              <StatCard label="Personalizados" value={customCount} />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(260px,1fr)_220px_170px_190px_160px]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Buscar
                </span>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Título, cliente ou perfil..."
                  className="app-input"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Módulo
                </span>

                <select
                  value={moduleFilter}
                  onChange={(event) =>
                    setModuleFilter(event.target.value)
                  }
                  className="app-input"
                >
                  <option value="todos">Todos os módulos</option>

                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Dificuldade
                </span>

                <select
                  value={difficultyFilter}
                  onChange={(event) =>
                    setDifficultyFilter(event.target.value)
                  }
                  className="app-input"
                >
                  <option value="todos">Todas</option>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Origem
                </span>

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="app-input"
                >
                  <option value="todos">Todos</option>
                  <option value="oficial">Oficiais</option>
                  <option value="personalizado">Personalizados</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Status
                </span>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="app-input"
                >
                  <option value="todos">Todos</option>
                  <option value="ativos">Ativos</option>
                  <option value="inativos">Inativos</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Limpar filtros
              </button>
            </div>

            {error && !selectedScenario && (
              <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                  Resultados
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                  Cenários disponíveis
                </h2>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                {filteredScenarios.length} encontrados
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            {isLoading ? (
              <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
                Carregando biblioteca...
              </div>
            ) : filteredScenarios.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-lg font-black text-[#08213f]">
                  Nenhum cenário encontrado.
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ajuste os filtros para localizar outro modelo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredScenarios.map((scenario) => (
                  <article
                    key={scenario.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-[#08213f]">
                          {scenario.title}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                          {scenario.description ||
                            "Sem descrição cadastrada."}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          <strong className="text-slate-700">
                            Cliente:
                          </strong>{" "}
                          {scenario.customer_name || "Não informado"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge tone="blue">
                            {scenario.modules?.name ||
                              "Módulo não informado"}
                          </Badge>

                          <Badge
                            tone={difficultyTone(
                              scenario.difficulty
                            )}
                          >
                            {difficultyLabel(scenario.difficulty)}
                          </Badge>

                          <Badge
                            tone={
                              scenario.is_active ? "green" : "red"
                            }
                          >
                            {scenario.is_active ? "Ativo" : "Inativo"}
                          </Badge>

                          <Badge tone="slate">
                            {scenario.scenario_type === "oficial"
                              ? "Oficial"
                              : "Personalizado"}
                          </Badge>

                          <Badge tone="slate">
                            Nível {scenario.track_level ?? 1}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
                        <Link
                          href="/professor/cenarios/previsualizar"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                        >
                          Testar
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            openDuplicateModal(scenario)
                          }
                          className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        >
                          Usar como modelo
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>

      {selectedScenario && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-scenario-title"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Novo cenário
                  </p>

                  <h2
                    id="duplicate-scenario-title"
                    className="mt-1 text-xl font-black tracking-tight text-[#08213f]"
                  >
                    Duplicar modelo
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDuplicateModal}
                  disabled={isDuplicating}
                  aria-label="Fechar janela"
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                  Cenário de origem
                </p>

                <p className="mt-1 text-base font-black text-[#08213f]">
                  {selectedScenario.title}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="blue">
                    {selectedScenario.modules?.name ||
                      "Módulo não informado"}
                  </Badge>

                  <Badge
                    tone={difficultyTone(
                      selectedScenario.difficulty
                    )}
                  >
                    {difficultyLabel(
                      selectedScenario.difficulty
                    )}
                  </Badge>

                  <Badge tone="slate">
                    {selectedScenario.scenario_type === "oficial"
                      ? "Oficial"
                      : "Personalizado"}
                  </Badge>
                </div>
              </div>

              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Título do novo cenário
                </span>

                <input
                  value={duplicateTitle}
                  onChange={(event) =>
                    setDuplicateTitle(event.target.value)
                  }
                  placeholder="Informe o título da nova versão"
                  className="app-input"
                  autoFocus
                />
              </label>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input
                  type="checkbox"
                  checked={duplicateActive}
                  onChange={(event) =>
                    setDuplicateActive(event.target.checked)
                  }
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-black text-[#08213f]">
                    Publicar imediatamente
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    Desmarcado é mais seguro. A cópia ficará inativa
                    até ser revisada pelo professor.
                  </span>
                </span>
              </label>

              <div className="mt-5 rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950 ring-1 ring-blue-100">
                Serão copiados o cliente, o perfil, todas as etapas,
                opções, pontuações, feedbacks e configurações da trilha.
              </div>

              {error && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {success}
                </div>
              )}

              {createdScenarioId && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-sm font-black text-[#08213f]">
                    {createdScenarioTitle}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    A nova cópia já está disponível na biblioteca de
                    cenários.
                  </p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href="/professor/cenarios"
                      className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
                    >
                      Abrir gerenciador
                    </Link>

                    <Link
                      href="/professor/cenarios/previsualizar"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Testar cenários
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDuplicateModal}
                  disabled={isDuplicating}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-50"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={
                    isDuplicating ||
                    !duplicateTitle.trim() ||
                    Boolean(createdScenarioId)
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDuplicating
                    ? "Duplicando..."
                    : createdScenarioId
                      ? "Cenário duplicado"
                      : "Criar cópia"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

