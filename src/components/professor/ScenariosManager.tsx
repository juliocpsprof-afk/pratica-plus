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

const difficultyOptions: Array<{
  value: ScenarioDifficulty;
  label: string;
}> = [
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
];

export function ScenariosManager() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty>("medio");
  const [customerName, setCustomerName] = useState("");
  const [customerProfile, setCustomerProfile] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [optionOne, setOptionOne] = useState("");
  const [optionTwo, setOptionTwo] = useState("");
  const [optionThree, setOptionThree] = useState("");
  const [bestOptionIndex, setBestOptionIndex] = useState("0");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const officialCount = useMemo(
    () => scenarios.filter((scenario) => scenario.scenario_type === "oficial").length,
    [scenarios]
  );

  const customCount = useMemo(
    () =>
      scenarios.filter((scenario) => scenario.scenario_type === "personalizado")
        .length,
    [scenarios]
  );

  async function loadData() {
    try {
      setError("");
      setIsLoading(true);

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
    setTitle("");
    setDescription("");
    setDifficulty("medio");
    setCustomerName("");
    setCustomerProfile("");
    setCustomerMessage("");
    setContextNote("");
    setOptionOne("");
    setOptionTwo("");
    setOptionThree("");
    setBestOptionIndex("0");
  }

  async function handleCreateScenario() {
    try {
      setError("");
      setSuccessMessage("");

      if (!moduleId) {
        setError("Selecione um módulo.");
        return;
      }

      if (!title.trim()) {
        setError("Informe o título do cenário.");
        return;
      }

      if (!description.trim()) {
        setError("Informe a descrição do cenário.");
        return;
      }

      if (!customerName.trim()) {
        setError("Informe o nome do cliente/personagem.");
        return;
      }

      if (!customerProfile.trim()) {
        setError("Informe o perfil do cliente.");
        return;
      }

      if (!customerMessage.trim()) {
        setError("Informe a mensagem inicial do cliente.");
        return;
      }

      const rawOptions = [optionOne, optionTwo, optionThree];

      if (rawOptions.some((option) => !option.trim())) {
        setError("Preencha as 3 opções de resposta.");
        return;
      }

      setIsSaving(true);

      await createScenario({
        title: title.trim(),
        description: description.trim(),
        moduleId,
        difficulty,
        customerName: customerName.trim(),
        customerProfile: customerProfile.trim(),
        customerMessage: customerMessage.trim(),
        contextNote: contextNote.trim(),
        options: rawOptions.map((option, index) => {
          const isBest = String(index) === bestOptionIndex;

          return {
            optionText: option.trim(),
            isBestOption: isBest,
            score: isBest ? 10 : index === 1 ? 4 : 1,
            feedback: isBest
              ? "Boa resposta. O aluno escolheu a melhor condução para a situação."
              : "Resposta fraca. O aluno precisa melhorar a condução nesta etapa.",
          };
        }),
      });

      resetForm();
      setSuccessMessage("Cenário personalizado criado com sucesso.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o cenário."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(scenario: ScenarioRow) {
    try {
      setError("");
      setSuccessMessage("");

      await updateScenarioStatus(scenario.id, !scenario.is_active);

      setScenarios((currentScenarios) =>
        currentScenarios.map((item) =>
          item.id === scenario.id
            ? { ...item, is_active: !scenario.is_active }
            : item
        )
      );
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
      setSuccessMessage("");

      if (scenario.scenario_type === "oficial") {
        setError("Cenários oficiais não podem ser removidos pela tela.");
        return;
      }

      await deleteScenario(scenario.id);
      setSuccessMessage("Cenário removido com sucesso.");
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
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Novo cenário
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Crie uma situação para o aluno resolver.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          O cenário personalizado entra na base de práticas junto com os cenários oficiais.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Módulo
            </label>
            <select
              value={moduleId}
              onChange={(event) => setModuleId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {modules.map((moduleItem) => (
                <option key={moduleItem.id} value={moduleItem.id}>
                  {moduleItem.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Título do cenário
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              type="text"
              placeholder="Ex: Cliente quer desconto"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explique o objetivo pedagógico do cenário."
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Cliente
              </label>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                type="text"
                placeholder="Ex: Ana Santos"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Dificuldade
              </label>
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as ScenarioDifficulty)
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Perfil do cliente
            </label>
            <input
              value={customerProfile}
              onChange={(event) => setCustomerProfile(event.target.value)}
              type="text"
              placeholder="Ex: Apressado, indeciso e comparando valores"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Fala inicial do cliente
            </label>
            <textarea
              value={customerMessage}
              onChange={(event) => setCustomerMessage(event.target.value)}
              placeholder="Ex: Eu gostei do curso, mas achei caro. Tem desconto?"
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Observação pedagógica
            </label>
            <textarea
              value={contextNote}
              onChange={(event) => setContextNote(event.target.value)}
              placeholder="Ex: O aluno deve investigar a necessidade antes de falar preço."
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="rounded-[1.5rem] bg-[#f4f8fc] p-5">
            <p className="text-sm font-black text-[#08213f]">
              Opções de resposta
            </p>

            <div className="mt-4 space-y-4">
              {[optionOne, optionTwo, optionThree].map((value, index) => {
                const setters = [setOptionOne, setOptionTwo, setOptionThree];

                return (
                  <div key={index}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-black text-slate-700">
                        Opção {index + 1}
                      </label>

                      <label className="flex items-center gap-2 text-xs font-black text-blue-700">
                        <input
                          type="radio"
                          name="bestOption"
                          value={index}
                          checked={bestOptionIndex === String(index)}
                          onChange={(event) =>
                            setBestOptionIndex(event.target.value)
                          }
                        />
                        Melhor resposta
                      </label>
                    </div>

                    <textarea
                      value={value}
                      onChange={(event) => setters[index](event.target.value)}
                      rows={2}
                      placeholder={`Digite a opção ${index + 1}`}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {successMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateScenario}
            disabled={isSaving}
            className="w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Cadastrar cenário"}
          </button>
        </div>
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Banco de cenários
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Cenários cadastrados
            </h2>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="rounded-full bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
          >
            Atualizar
          </button>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-blue-50 p-5">
            <p className="text-xs font-black uppercase text-blue-700">
              Total
            </p>
            <p className="mt-1 text-3xl font-black text-blue-900">
              {scenarios.length}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-5">
            <p className="text-xs font-black uppercase text-emerald-700">
              Oficiais
            </p>
            <p className="mt-1 text-3xl font-black text-emerald-900">
              {officialCount}
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="text-xs font-black uppercase text-amber-700">
              Personalizados
            </p>
            <p className="mt-1 text-3xl font-black text-amber-900">
              {customCount}
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center text-sm font-black text-slate-500">
            Carregando cenários...
          </div>
        ) : scenarios.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              🧩
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhum cenário cadastrado.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Cadastre cenários para alimentar as simulações.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {scenarios.map((scenario) => (
              <article
                key={scenario.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#08213f]">
                        {scenario.title}
                      </h3>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {scenario.modules?.name ?? "Sem módulo"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          scenario.scenario_type === "oficial"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {scenario.scenario_type}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          scenario.is_active
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {scenario.is_active ? "ativo" : "inativo"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {scenario.description}
                    </p>

                    <p className="mt-3 text-sm font-bold text-slate-500">
                      Cliente: {scenario.customer_name ?? "--"} • Dificuldade:{" "}
                      {scenario.difficulty}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Perfil: {scenario.customer_profile ?? "--"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(scenario)}
                      className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                    >
                      {scenario.is_active ? "Desativar" : "Ativar"}
                    </button>

                    {scenario.scenario_type === "personalizado" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteScenario(scenario)}
                        className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </section>
  );
}
