type SimulationWorkspaceProps = {
  type: "telemarketing" | "vendas";
};

export function SimulationWorkspace({ type }: SimulationWorkspaceProps) {
  const isTelemarketing = type === "telemarketing";

  const config = isTelemarketing
    ? {
        title: "Atendimento ao cliente",
        subtitle: "Cliente ligando para tirar dúvidas sobre um curso.",
        customer: "Carla Andrade",
        profile: "Cliente indecisa, educada e com pouco tempo disponível.",
        image:
          "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1000&q=80",
        tag: "Chamada ativa",
        color: "bg-blue-700",
        message:
          "Olá, eu vi uma informação sobre o curso, mas não entendi direito como funciona. Você pode me explicar de forma rápida?",
        options: [
          "Cumprimentar, acolher a dúvida e explicar de forma objetiva.",
          "Falar todos os detalhes de uma vez, sem entender a necessidade.",
          "Pedir para a cliente procurar as informações depois.",
        ],
      }
    : {
        title: "Atendimento comercial",
        subtitle: "Cliente avaliando se deve fechar a matrícula.",
        customer: "Marcelo Lima",
        profile: "Cliente negociador, atento ao preço e comparando opções.",
        image:
          "https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1000&q=80",
        tag: "Objeção de preço",
        color: "bg-violet-700",
        message:
          "Eu gostei da proposta, mas achei o valor um pouco alto. Preciso entender se realmente vale a pena para mim.",
        options: [
          "Investigar a necessidade e reforçar o valor do curso antes de falar desconto.",
          "Dar desconto imediatamente para tentar fechar rápido.",
          "Dizer que ele pode procurar outro lugar se achou caro.",
        ],
      };

  return (
    <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="h-64 overflow-hidden">
          <img
            src={config.image}
            alt={config.customer}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-6">
          <span className={`rounded-full ${config.color} px-4 py-2 text-xs font-black text-white`}>
            {config.tag}
          </span>

          <h2 className="mt-5 text-2xl font-black text-[#08213f]">
            {config.customer}
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {config.profile}
          </p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Tempo
              </p>
              <p className="mt-1 text-xl font-black text-[#08213f]">
                02:34
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Dificuldade
              </p>
              <p className="mt-1 text-xl font-black text-[#08213f]">
                Médio
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 pb-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
            {config.title}
          </p>

          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-[#08213f] md:text-4xl">
            {config.subtitle}
          </h1>
        </div>

        <div className="mt-6 rounded-[1.75rem] bg-[#f4f8fc] p-5">
          <div className="max-w-2xl rounded-3xl rounded-tl-md bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-[#08213f]">
              {config.customer}
            </p>
            <p className="mt-2 text-base leading-7 text-slate-700">
              “{config.message}”
            </p>
          </div>
        </div>

        <div className="mt-7">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
            Escolha sua resposta
          </p>

          <div className="mt-4 grid gap-3">
            {config.options.map((option, index) => (
              <button
                key={option}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#08213f] text-sm font-black text-white">
                  {index + 1}
                </span>

                <span className="text-sm font-bold leading-6 text-slate-700 group-hover:text-[#08213f]">
                  {option}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {["Comunicação", "Empatia", "Escuta ativa", "Resolução"].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-400">{item}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[70%] rounded-full bg-[#f7c600]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </section>
  );
}
