"use client";

import { useEffect, useMemo, useState } from "react";
import { getModules, ModuleRow } from "@/services/modules.service";
import {
  createScenario,
  deleteScenario,
  getScenarios,
  ScenarioDifficulty,
  ScenarioRow,
  updateScenarioStatus,
} from "@/services/scenarios.service";

function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "blue" | "green" | "amber" | "red";
}) {
  const tones = {
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

function ActionButton({
  children,
  tone = "secondary",
  onClick,
}: {
  children: string;
  tone?: "primary" | "secondary" | "danger" | "warning";
  onClick: () => void;
}) {
  const tones = {
    primary:
      "bg-[#08213f] text-white hover:bg-blue-800 focus:ring-blue-100",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-100",
    warning:
      "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black shadow-sm transition focus:outline-none focus:ring-4 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function FormLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-xs font-bold text-slate-600">
      {children}
    </span>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-[#08213f]">
        {value}
      </p>
    </div>
  );
}

function getDifficultyLabel(difficulty: ScenarioDifficulty) {
  if (difficulty === "facil") return "Fácil";
  if (difficulty === "medio") return "Médio";
  return "Difícil";
}

function getDifficultyTone(difficulty: ScenarioDifficulty) {
  if (difficulty === "facil") return "green";
  if (difficulty === "medio") return "amber";
  return "red";
}

export function ScenariosManager() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty>("facil");
  const [customerName, setCustomerName] = useState("");
  const [customerProfile, setCustomerProfile] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [bestOption, setBestOption] = useState<"a" | "b" | "c">("a");
  const [feedbackA, setFeedbackA] = useState("");
  const [feedbackB, setFeedbackB] = useState("");
  const [feedbackC, setFeedbackC] = useState("");

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("todos");
  const [difficultyFilter, setDifficultyFilter] = useState("todos");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const officialCount = scenarios.filter(
    (scenario) => scenario.scenario_type === "oficial"
  ).length;

  const customCount = scenarios.filter(
    (scenario) => scenario.scenario_type === "personalizado"
  ).length;

  const activeCount = scenarios.filter((scenario) => scenario.is_active).length;

  const filteredScenarios = useMemo(() => {
    const term = search.trim().toLowerCase();

    return scenarios.filter((scenario) => {
      const text = `${scenario.title} ${scenario.description ?? ""} ${
        scenario.customer_name ?? ""
      } ${scenario.customer_profile ?? ""} ${
        scenario.modules?.name ?? ""
      }`.toLowerCase();

      const matchTerm = !term || text.includes(term);
      const matchModule =
        moduleFilter === "todos" || scenario.module_id === moduleFilter;
      const matchDifficulty =
        difficultyFilter === "todos" || scenario.difficulty === difficultyFilter;

      return matchTerm && matchModule && matchDifficulty;
    });
  }, [scenarios, search, moduleFilter, difficultyFilter]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [modulesData, scenariosData] = await Promise.all([
        getModules(),
        getScenarios(),
      ]);

      setModules(modulesData);
      setScenarios(scenariosData);

      if (!moduleId && modulesData[0]) {
        setModuleId(modulesData[0].id);
      }
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
    loadData();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDifficulty("facil");
    setCustomerName("");
    setCustomerProfile("");
    setCustomerMessage("");
    setContextNote("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setBestOption("a");
    setFeedbackA("");
    setFeedbackB("");
    setFeedbackC("");
  }

  async function handleCreateScenario() {
    try {
      setError("");
      setMessage("");

      if (!title.trim()) {
        setError("Informe o título do cenário.");
        return;
      }

      if (!moduleId) {
        setError("Selecione o módulo do cenário.");
        return;
      }

      if (!customerMessage.trim()) {
        setError("Informe a fala inicial do cliente.");
        return;
      }

      if (!optionA.trim() || !optionB.trim() || !optionC.trim()) {
        setError("Preencha as três opções de resposta.");
        return;
      }

      setIsSaving(true);

      await createScenario({
        title,
        description,
        moduleId,
        difficulty,
        customerName,
        customerProfile,
        customerMessage,
        contextNote,
        optionA,
        optionB,
        optionC,
        bestOption,
        feedbackA,
        feedbackB,
        feedbackC,
      });

      setMessage("Cenário cadastrado com sucesso.");
      resetForm();

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o cenário."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(scenario: ScenarioRow) {
    try {
      setError("");
      setMessage("");

      await updateScenarioStatus(scenario.id, !scenario.is_active);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status do cenário."
      );
    }
  }

  async function handleDeleteScenario(scenario: ScenarioRow) {
    try {
      setError("");
      setMessage("");

      if (scenario.scenario_type === "oficial") {
        setError("Cenários oficiais não podem ser removidos pela tela.");
        return;
      }

      await deleteScenario(scenario.id);

      setMessage("Cenário removido.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o cenário."
      );
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Configuração
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Novo cenário personalizado
              </h2>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              Oficiais: {officialCount} • Personalizados: {customCount}
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_180px]">
            <label className="block">
              <FormLabel>Título do cenário</FormLabel>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                type="text"
                placeholder="Ex: Cliente indeciso sobre o curso"
                className="app-input"
              />
            </label>

            <label className="block">
              <FormLabel>Módulo</FormLabel>
              <select
                value={moduleId}
                onChange={(event) => setModuleId(event.target.value)}
                className="app-input"
              >
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <FormLabel>Dificuldade</FormLabel>
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as ScenarioDifficulty)
                }
                className="app-input"
              >
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <FormLabel>Descrição</FormLabel>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              type="text"
              placeholder="Resumo do que o aluno irá praticar neste cenário"
              className="app-input"
            />
          </label>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block">
              <FormLabel>Nome genérico do cliente</FormLabel>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                type="text"
                placeholder="Ex: Patrícia Lima"
                className="app-input"
              />
            </label>

            <label className="block">
              <FormLabel>Perfil do cliente</FormLabel>
              <input
                value={customerProfile}
                onChange={(event) => setCustomerProfile(event.target.value)}
                type="text"
                placeholder="Ex: Cliente insegura, educada e cautelosa"
                className="app-input"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block">
              <FormLabel>Fala do cliente</FormLabel>
              <textarea
                value={customerMessage}
                onChange={(event) => setCustomerMessage(event.target.value)}
                rows={4}
                placeholder="Digite a mensagem inicial do cliente..."
                className="app-input resize-none"
              />
            </label>

            <label className="block">
              <FormLabel>Objetivo técnico da etapa</FormLabel>
              <textarea
                value={contextNote}
                onChange={(event) => setContextNote(event.target.value)}
                rows={4}
                placeholder="Ex: aluno deve acolher, fazer triagem e evitar pressão."
                className="app-input resize-none"
              />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-[#08213f]">
                  Opções de resposta
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Preencha as três respostas. A correta pode estar em qualquer posição.
                </p>
              </div>

              <div className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                Correta: opção {bestOption.toUpperCase()}
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#08213f]">Opção A</p>
                  <button
                    type="button"
                    onClick={() => setBestOption("a")}
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      bestOption === "a"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Correta
                  </button>
                </div>

                <textarea
                  value={optionA}
                  onChange={(event) => setOptionA(event.target.value)}
                  rows={5}
                  placeholder="Resposta do aluno..."
                  className="app-input resize-none"
                />

                <textarea
                  value={feedbackA}
                  onChange={(event) => setFeedbackA(event.target.value)}
                  rows={3}
                  placeholder="Feedback técnico da opção A..."
                  className="app-input mt-3 resize-none"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#08213f]">Opção B</p>
                  <button
                    type="button"
                    onClick={() => setBestOption("b")}
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      bestOption === "b"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Correta
                  </button>
                </div>

                <textarea
                  value={optionB}
                  onChange={(event) => setOptionB(event.target.value)}
                  rows={5}
                  placeholder="Resposta do aluno..."
                  className="app-input resize-none"
                />

                <textarea
                  value={feedbackB}
                  onChange={(event) => setFeedbackB(event.target.value)}
                  rows={3}
                  placeholder="Feedback técnico da opção B..."
                  className="app-input mt-3 resize-none"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#08213f]">Opção C</p>
                  <button
                    type="button"
                    onClick={() => setBestOption("c")}
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      bestOption === "c"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Correta
                  </button>
                </div>

                <textarea
                  value={optionC}
                  onChange={(event) => setOptionC(event.target.value)}
                  rows={5}
                  placeholder="Resposta do aluno..."
                  className="app-input resize-none"
                />

                <textarea
                  value={feedbackC}
                  onChange={(event) => setFeedbackC(event.target.value)}
                  rows={3}
                  placeholder="Feedback técnico da opção C..."
                  className="app-input mt-3 resize-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {message}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={handleCreateScenario}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Cadastrar cenário"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Cenários cadastrados
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Biblioteca de práticas
              </h2>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cenário..."
                className="app-input min-w-[240px] px-4 py-2.5 text-sm"
              />

              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                className="app-input min-w-[180px] px-4 py-2.5 text-sm"
              >
                <option value="todos">Todos os módulos</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>

              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value)}
                className="app-input min-w-[160px] px-4 py-2.5 text-sm"
              >
                <option value="todos">Todas</option>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>

              <ActionButton onClick={loadData}>Atualizar</ActionButton>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <SummaryItem label="Ativos" value={activeCount} />
            <SummaryItem label="Oficiais" value={officialCount} />
            <SummaryItem label="Personalizados" value={customCount} />
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Carregando cenários...
            </div>
          ) : filteredScenarios.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">
                Nenhum cenário encontrado.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Cadastre um cenário ou ajuste os filtros.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScenarios.map((scenario) => (
                <article
                  key={scenario.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#08213f]">
                        {scenario.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {scenario.description || "Sem descrição cadastrada."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="blue">
                          {scenario.modules?.name ?? "Sem módulo"}
                        </Badge>

                        <Badge tone={getDifficultyTone(scenario.difficulty)}>
                          {getDifficultyLabel(scenario.difficulty)}
                        </Badge>

                        <Badge tone={scenario.is_active ? "green" : "slate"}>
                          {scenario.is_active ? "Ativo" : "Inativo"}
                        </Badge>

                        <Badge
                          tone={
                            scenario.scenario_type === "oficial"
                              ? "blue"
                              : "amber"
                          }
                        >
                          {scenario.scenario_type === "oficial"
                            ? "Oficial"
                            : "Personalizado"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <SummaryItem
                        label="Cliente"
                        value={scenario.customer_name ?? "Não informado"}
                      />

                      <SummaryItem
                        label="Etapas"
                        value={scenario.scenario_steps?.length ?? 0}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <ActionButton
                        onClick={() => handleToggleStatus(scenario)}
                      >
                        {scenario.is_active ? "Desativar" : "Ativar"}
                      </ActionButton>

                      <ActionButton
                        tone="danger"
                        onClick={() => handleDeleteScenario(scenario)}
                      >
                        Remover
                      </ActionButton>
                    </div>
                  </div>

                  {(scenario.customer_profile ||
                    scenario.technical_focus ||
                    scenario.learning_objective) && (
                    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
                      <SummaryItem
                        label="Perfil"
                        value={scenario.customer_profile ?? "Não informado"}
                      />

                      <SummaryItem
                        label="Foco técnico"
                        value={scenario.technical_focus ?? "Não informado"}
                      />

                      <SummaryItem
                        label="Objetivo"
                        value={scenario.learning_objective ?? "Não informado"}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
