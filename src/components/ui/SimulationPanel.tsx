type SimulationPanelProps = {
  module: "telemarketing" | "vendas";
};

export function SimulationPanel({ module }: SimulationPanelProps) {
  const isTelemarketing = module === "telemarketing";

  const client = isTelemarketing
    ? {
        title: "Cliente na linha",
        name: "Carla Andrade",
        profile: "Indecisa e com pouco tempo",
        status: "Chamada em andamento",
        icon: "☎️",
        gradient: "from-blue-700 to-cyan-500",
      }
    : {
        title: "Cliente em negociação",
        name: "Marcelo Lima",
        profile: "Negociador e atento ao preço",
        status: "Etapa: objeção",
        icon: "🛒",
        gradient: "from-violet-700 to-fuchsia-500",
      };

  const options = isTelemarketing
    ? [
        "Cumprimentar, identificar a empresa e perguntar como pode ajudar.",
        "Pedir para o cliente aguardar sem explicar o motivo.",
        "Encaminhar direto para o supervisor sem triagem.",
      ]
    : [
        "Investigar necessidade antes de falar preço.",
        "Oferecer desconto imediatamente.",
        "Forçar o fechamento sem lidar com a objeção.",
      ];

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_1fr_300px]">
      <aside className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${client.gradient} text-3xl shadow-lg`}
        >
          {client.icon}
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">
          {client.title}
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">
          {client.name}
        </h2>

        <p className="mt-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
          {client.profile}
        </p>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">Status</p>
            <p className="mt-1 text-sm font-semibold text-emerald-950">
              {client.status}
            </p>
          </div>

          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-700">Tempo</p>
            <p className="mt-1 text-sm font-semibold text-blue-950">
              02:34 de atendimento
            </p>
          </div>
        </div>
      </aside>

      <main className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-blue-700">
              Simulação guiada
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Escolha a melhor resposta
            </h1>
          </div>

          <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
            Nível médio
          </div>
        </div>

        <div className="space-y-4 rounded-3xl bg-slate-100 p-5">
          <div className="max-w-[80%] rounded-3xl rounded-tl-md bg-white p-4 shadow-sm">
            <p className="text-sm leading-6 text-slate-700">
              {isTelemarketing
                ? "Olá, eu vi uma informação sobre o curso, mas não entendi direito como funciona. Eu tenho pouco tempo agora."
                : "Eu gostei do curso, mas achei o valor um pouco alto. Preciso pensar se realmente vale a pena."}
            </p>
          </div>

          <div className="ml-auto max-w-[80%] rounded-3xl rounded-tr-md bg-blue-700 p-4 text-white shadow-sm">
            <p className="text-sm leading-6">
              Sua resposta aparecerá aqui depois da escolha.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {options.map((option, index) => (
            <button
              key={option}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
            >
              <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                {index + 1}
              </span>
              {option}
            </button>
          ))}
        </div>
      </main>

      <aside className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
        <p className="text-sm font-bold text-slate-500">Competências</p>

        <div className="mt-5 space-y-4">
          {[
            ["Comunicação", "82%"],
            ["Escuta ativa", "76%"],
            ["Empatia", "91%"],
            ["Resolução", "68%"],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold text-slate-700">{label}</span>
                <span className="font-black text-slate-950">{value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-700"
                  style={{ width: value }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-amber-50 p-5">
          <p className="text-sm font-black text-amber-900">Dica do sistema</p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Respostas que acolhem o cliente antes de vender costumam gerar melhor pontuação.
          </p>
        </div>
      </aside>
    </section>
  );
}
