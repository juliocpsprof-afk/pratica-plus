import { generateStudentAccess } from "@/services/auth.service";
import { AppShell } from "@/components/layout/AppShell";

const examples = [
  "João Silva Santos",
  "João da Silva Santos",
  "Maria de Fátima Souza",
  "Pedro dos Santos Oliveira",
  "Júlio César Almeida",
];

export default function TestePage() {
  const generatedAccess = examples.map((name) => generateStudentAccess(name));

  return (
    <AppShell>
      <header className="mb-8">
        <p className="text-sm font-semibold text-blue-700">Teste de regras</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Geração de usuário e senha
        </h1>
        <p className="mt-2 text-slate-600">
          Esta página valida a regra oficial do Prática+: usuário com primeiro nome + segundo elemento e senha com primeiro nome + 123.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-5 py-4 font-semibold">Nome completo</th>
              <th className="px-5 py-4 font-semibold">Username</th>
              <th className="px-5 py-4 font-semibold">Senha</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {generatedAccess.map((access) => (
              <tr key={access.fullName}>
                <td className="px-5 py-4 text-slate-700">{access.fullName}</td>
                <td className="px-5 py-4 font-semibold text-blue-700">
                  {access.username}
                </td>
                <td className="px-5 py-4 font-semibold text-slate-950">
                  {access.password}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
