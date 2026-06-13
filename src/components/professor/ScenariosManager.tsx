"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { getModules, ModuleRow } from "@/services/modules.service";
import {
  createScenario,
  deleteScenario,
  getScenarioDetails,
  getScenarios,
  ScenarioDetails,
  ScenarioDifficulty,
  ScenarioOptionInput,
  ScenarioRow,
  ScenarioStepInput,
  ScenarioType,
  updateScenario,
  updateScenarioStatus,
} from "@/services/scenarios.service";

type ScenarioFormState = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  difficulty: ScenarioDifficulty;
  customer_name: string;
  customer_profile: string;
  scenario_type: ScenarioType;
  is_active: boolean;
  track_level: number;
  track_order: number;
  learning_objective: string;
  technical_focus: string;
  source_lesson: string;
  steps: ScenarioStepInput[];
};

const emptyOption = (): ScenarioOptionInput => ({
  option_text: "",
  is_best_option: false,
  score: 0,
  feedback: "",
});

const emptyStep = (): ScenarioStepInput => ({
  customer_message: "",
  context_note: "",
  options: [
    {
      option_text: "",
      is_best_option: true,
      score: 10,
      feedback: "",
    },
    {
      option_text: "",
      is_best_option: false,
      score: 5,
      feedback: "",
    },
    {
      option_text: "",
      is_best_option: false,
      score: 0,
      feedback: "",
    },
  ],
});

const initialForm = (): ScenarioFormState => ({
  id: "",
  module_id: "",
  title: "",
  description: "",
  difficulty: "facil",
  customer_name: "",
  customer_profile: "",
  scenario_type: "personalizado",
  is_active: true,
  track_level: 1,
  track_order: 1,
  learning_objective: "",
  technical_focus: "",
  source_lesson: "",
  steps: [emptyStep()],
});

function difficultyLabel(value: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";
  return value;
}

function difficultyTone(value: string) {
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
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function SmallButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "secondary",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const variants = {
    primary:
      "bg-[#08213f] text-white hover:bg-blue-800 focus:ring-blue-100 border-[#08213f]",
    secondary:
      "bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200 border-slate-300",
    danger:
      "bg-white text-red-700 hover:bg-red-50 focus:ring-red-100 border-red-200",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-black shadow-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

function toFormState(details: ScenarioDetails): ScenarioFormState {
  return {
    id: details.id,
    module_id: details.module_id,
    title: details.title,
    description: details.description ?? "",
    difficulty: details.difficulty,
    customer_name: details.customer_name ?? "",
    customer_profile: details.customer_profile ?? "",
    scenario_type: details.scenario_type,
    is_active: details.is_active,
    track_level: details.track_level ?? 1,
    track_order: details.track_order ?? 1,
    learning_objective: details.learning_objective ?? "",
    technical_focus: details.technical_focus ?? "",
    source_lesson: details.source_lesson ?? "",
    steps:
      details.steps.length > 0
        ? details.steps.map((step) => ({
            customer_message: step.customer_message,
            context_note: step.context_note ?? "",
            options:
              step.options.length > 0
                ? step.options.map((option) => ({
                    option_text: option.option_text,
                    is_best_option: option.is_best_option,
                    score: Number(option.score ?? 0),
                    feedback: option.feedback ?? "",
                  }))
                : [emptyOption(), emptyOption()],
          }))
        : [emptyStep()],
  };
}

export function ScenariosManager() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [form, setForm] = useState<ScenarioFormState>(initialForm());
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("todos");
  const [difficultyFilter, setDifficultyFilter] = useState("todos");
  const [editingScenarioId, setEditingScenarioId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  const isEditing = Boolean(editingScenarioId);

  const filteredScenarios = useMemo(() => {
    const term = search.trim().toLowerCase();

    return scenarios.filter((scenario) => {
      const matchesSearch =
        !term ||
        `${scenario.title} ${scenario.customer_name} ${scenario.customer_profile} ${scenario.modules?.name ?? ""}`
          .toLowerCase()
          .includes(term);

      const matchesModule =
        moduleFilter === "todos" || scenario.module_id === moduleFilter;

      const matchesDifficulty =
        difficultyFilter === "todos" || scenario.difficulty === difficultyFilter;

      return matchesSearch && matchesModule && matchesDifficulty;
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

      setForm((current) => ({
        ...current,
        module_id: current.module_id || modulesData[0]?.id || "",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar cenários."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setEditingScenarioId("");
    setForm({
      ...initialForm(),
      module_id: modules[0]?.id || "",
    });
    setError("");
    setSuccess("");
  }

  function updateField<K extends keyof ScenarioFormState>(
    field: K,
    value: ScenarioFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateStep(
    stepIndex: number,
    field: keyof ScenarioStepInput,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              [field]: value,
            }
          : step
      ),
    }));
  }

  function updateOption(
    stepIndex: number,
    optionIndex: number,
    field: keyof ScenarioOptionInput,
    value: string | number | boolean
  ) {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, currentStepIndex) => {
        if (currentStepIndex !== stepIndex) {
          return step;
        }

        return {
          ...step,
          options: step.options.map((option, currentOptionIndex) => {
            if (currentOptionIndex !== optionIndex) {
              if (field === "is_best_option" && value === true) {
                return {
                  ...option,
                  is_best_option: false,
                };
              }

              return option;
            }

            return {
              ...option,
              [field]: field === "score" ? Number(value) : value,
            };
          }),
        };
      }),
    }));
  }

  function addStep() {
    setForm((current) => ({
      ...current,
      steps: [...current.steps, emptyStep()],
    }));
  }

  function removeStep(stepIndex: number) {
    setForm((current) => ({
      ...current,
      steps:
        current.steps.length === 1
          ? current.steps
          : current.steps.filter((_, index) => index !== stepIndex),
    }));
  }

  function addOption(stepIndex: number) {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              options: [...step.options, emptyOption()],
            }
          : step
      ),
    }));
  }

  function removeOption(stepIndex: number, optionIndex: number) {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, index) => {
        if (index !== stepIndex) {
          return step;
        }

        if (step.options.length <= 2) {
          return step;
        }

        const nextOptions = step.options.filter(
          (_, currentOptionIndex) => currentOptionIndex !== optionIndex
        );

        if (!nextOptions.some((option) => option.is_best_option)) {
          nextOptions[0] = {
            ...nextOptions[0],
            is_best_option: true,
          };
        }

        return {
          ...step,
          options: nextOptions,
        };
      }),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (isEditing) {
        await updateScenario({
          ...form,
          id: editingScenarioId,
        });

        setSuccess("Cenário atualizado com sucesso.");
      } else {
        await createScenario(form);

        setSuccess("Cenário criado com sucesso.");
      }

      await loadData();

      if (!isEditing) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o cenário."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit(scenarioId: string) {
    try {
      setIsLoadingEdit(true);
      setError("");
      setSuccess("");

      const details = await getScenarioDetails(scenarioId);

      setEditingScenarioId(scenarioId);
      setForm(toFormState(details));

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível abrir o cenário."
      );
    } finally {
      setIsLoadingEdit(false);
    }
  }

  async function handleToggleStatus(scenario: ScenarioRow) {
    try {
      setError("");
      setSuccess("");

      await updateScenarioStatus(scenario.id, !scenario.is_active);
      await loadData();

      setSuccess(
        scenario.is_active
          ? "Cenário inativado com sucesso."
          : "Cenário ativado com sucesso."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível alterar o status."
      );
    }
  }

  async function handleDelete(scenario: ScenarioRow) {
    const confirmed = window.confirm(
      `Deseja excluir o cenário "${scenario.title}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteScenario(scenario.id);
      await loadData();

      if (editingScenarioId === scenario.id) {
        resetForm();
      }

      setSuccess("Cenário excluído com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível excluir o cenário."
      );
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                {isEditing ? "Editar cenário" : "Novo cenário"}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                {isEditing ? "Atualizar simulação" : "Cadastrar simulação"}
              </h2>
            </div>

            {isEditing && (
              <SmallButton onClick={resetForm}>
                Cancelar edição
              </SmallButton>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6">
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {success}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-4">
            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Título do cenário
              </span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Ex.: Cliente indeciso sobre matrícula"
                className="app-input"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Módulo
              </span>
              <select
                value={form.module_id}
                onChange={(event) => updateField("module_id", event.target.value)}
                className="app-input"
              >
                <option value="">Selecione</option>
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
                value={form.difficulty}
                onChange={(event) =>
                  updateField("difficulty", event.target.value as ScenarioDifficulty)
                }
                className="app-input"
              >
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Cliente/personagem
              </span>
              <input
                value={form.customer_name}
                onChange={(event) => updateField("customer_name", event.target.value)}
                placeholder="Ex.: Dona Marta"
                className="app-input"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Perfil do cliente
              </span>
              <input
                value={form.customer_profile}
                onChange={(event) =>
                  updateField("customer_profile", event.target.value)
                }
                placeholder="Ex.: Responsável preocupada com preço e segurança"
                className="app-input"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Tipo
              </span>
              <select
                value={form.scenario_type}
                onChange={(event) =>
                  updateField("scenario_type", event.target.value as ScenarioType)
                }
                className="app-input"
              >
                <option value="personalizado">Personalizado</option>
                <option value="oficial">Oficial</option>
              </select>
            </label>

            <label className="block lg:col-span-4">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Descrição
              </span>
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Explique rapidamente o contexto da simulação."
                className="app-input min-h-[90px]"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Nível da trilha
              </span>
              <input
                type="number"
                min={1}
                value={form.track_level}
                onChange={(event) =>
                  updateField("track_level", Number(event.target.value))
                }
                className="app-input"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Ordem
              </span>
              <input
                type="number"
                min={1}
                value={form.track_order}
                onChange={(event) =>
                  updateField("track_order", Number(event.target.value))
                }
                className="app-input"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:col-span-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => updateField("is_active", event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-black text-slate-700">
                Cenário ativo para os alunos
              </span>
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Objetivo pedagógico
              </span>
              <textarea
                value={form.learning_objective}
                onChange={(event) =>
                  updateField("learning_objective", event.target.value)
                }
                placeholder="Ex.: Treinar escuta ativa e contorno de objeções."
                className="app-input min-h-[90px]"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Foco técnico
              </span>
              <textarea
                value={form.technical_focus}
                onChange={(event) =>
                  updateField("technical_focus", event.target.value)
                }
                placeholder="Ex.: Comunicação clara, acolhimento e fechamento."
                className="app-input min-h-[90px]"
              />
            </label>

            <label className="block lg:col-span-4">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Fonte/Aula de referência
              </span>
              <input
                value={form.source_lesson}
                onChange={(event) => updateField("source_lesson", event.target.value)}
                placeholder="Ex.: Apostila de Técnica de Vendas, capítulo objeções"
                className="app-input"
              />
            </label>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                  Conversa
                </p>
                <h3 className="mt-1 text-lg font-black text-[#08213f]">
                  Etapas e respostas
                </h3>
              </div>

              <SmallButton onClick={addStep}>
                Adicionar etapa
              </SmallButton>
            </div>

            <div className="mt-5 space-y-5">
              {form.steps.map((step, stepIndex) => (
                <div
                  key={`step-${stepIndex}`}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Etapa {stepIndex + 1}
                      </p>
                      <h4 className="mt-1 text-base font-black text-[#08213f]">
                        Mensagem do cliente
                      </h4>
                    </div>

                    <SmallButton
                      onClick={() => removeStep(stepIndex)}
                      disabled={form.steps.length === 1}
                      variant="danger"
                    >
                      Remover etapa
                    </SmallButton>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-600">
                        Fala do cliente
                      </span>
                      <textarea
                        value={step.customer_message}
                        onChange={(event) =>
                          updateStep(stepIndex, "customer_message", event.target.value)
                        }
                        placeholder="Digite a fala do cliente nesta etapa."
                        className="app-input min-h-[120px]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-600">
                        Observação interna
                      </span>
                      <textarea
                        value={step.context_note}
                        onChange={(event) =>
                          updateStep(stepIndex, "context_note", event.target.value)
                        }
                        placeholder="Observação para o professor ou contexto da etapa."
                        className="app-input min-h-[120px]"
                      />
                    </label>
                  </div>

                  <div className="mt-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <h5 className="text-sm font-black text-[#08213f]">
                        Opções de resposta
                      </h5>

                      <SmallButton onClick={() => addOption(stepIndex)}>
                        Adicionar opção
                      </SmallButton>
                    </div>

                    <div className="mt-3 space-y-3">
                      {step.options.map((option, optionIndex) => (
                        <div
                          key={`step-${stepIndex}-option-${optionIndex}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_100px_160px]">
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                Opção {optionIndex + 1}
                              </span>
                              <textarea
                                value={option.option_text}
                                onChange={(event) =>
                                  updateOption(
                                    stepIndex,
                                    optionIndex,
                                    "option_text",
                                    event.target.value
                                  )
                                }
                                placeholder="Texto da resposta que o aluno pode escolher."
                                className="app-input min-h-[90px] bg-white"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                Pontos
                              </span>
                              <input
                                type="number"
                                value={option.score}
                                onChange={(event) =>
                                  updateOption(
                                    stepIndex,
                                    optionIndex,
                                    "score",
                                    Number(event.target.value)
                                  )
                                }
                                className="app-input bg-white"
                              />
                            </label>

                            <div className="space-y-3">
                              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <input
                                  type="radio"
                                  checked={option.is_best_option}
                                  onChange={() =>
                                    updateOption(
                                      stepIndex,
                                      optionIndex,
                                      "is_best_option",
                                      true
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="text-sm font-black text-slate-700">
                                  Melhor opção
                                </span>
                              </label>

                              <SmallButton
                                onClick={() => removeOption(stepIndex, optionIndex)}
                                disabled={step.options.length <= 2}
                                variant="danger"
                              >
                                Remover
                              </SmallButton>
                            </div>
                          </div>

                          <label className="mt-4 block">
                            <span className="mb-1.5 block text-xs font-bold text-slate-600">
                              Feedback desta opção
                            </span>
                            <textarea
                              value={option.feedback}
                              onChange={(event) =>
                                updateOption(
                                  stepIndex,
                                  optionIndex,
                                  "feedback",
                                  event.target.value
                                )
                              }
                              placeholder="Feedback que aparecerá para o aluno após escolher esta resposta."
                              className="app-input min-h-[80px] bg-white"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {isEditing && (
              <SmallButton onClick={resetForm}>
                Cancelar
              </SmallButton>
            )}

            <SmallButton type="submit" disabled={isSaving} variant="primary">
              {isSaving
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Cadastrar cenário"}
            </SmallButton>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Cenários cadastrados
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Biblioteca de simulações
              </h2>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cenário..."
                className="app-input min-w-[260px] px-4 py-2.5 text-sm"
              />

              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                className="app-input px-4 py-2.5 text-sm lg:w-[210px]"
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
                className="app-input px-4 py-2.5 text-sm lg:w-[160px]"
              >
                <option value="todos">Todas</option>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
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
                Cadastre um novo cenário para começar a prática.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScenarios.map((scenario) => (
                <article
                  key={scenario.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#08213f]">
                        {scenario.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {scenario.customer_name || "Cliente não informado"} •{" "}
                        {scenario.customer_profile || "Perfil não informado"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="blue">
                          {scenario.modules?.name ?? "Módulo não informado"}
                        </Badge>

                        <Badge tone={difficultyTone(scenario.difficulty)}>
                          {difficultyLabel(scenario.difficulty)}
                        </Badge>

                        <Badge tone={scenario.is_active ? "green" : "red"}>
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
                      <SmallButton
                        onClick={() => handleEdit(scenario.id)}
                        disabled={isLoadingEdit}
                      >
                        {isLoadingEdit && editingScenarioId === scenario.id
                          ? "Abrindo..."
                          : "Editar"}
                      </SmallButton>

                      <SmallButton onClick={() => handleToggleStatus(scenario)}>
                        {scenario.is_active ? "Inativar" : "Ativar"}
                      </SmallButton>

                      <SmallButton
                        onClick={() => handleDelete(scenario)}
                        disabled={scenario.scenario_type !== "personalizado"}
                        variant="danger"
                      >
                        Excluir
                      </SmallButton>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

