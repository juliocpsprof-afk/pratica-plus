import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f4f8fc] px-6 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-white shadow-xl ring-1 ring-slate-200 lg:grid-cols-[1fr_480px]">
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <Link href="/" className="text-sm font-black text-blue-700 hover:underline">
            ← Voltar para o início
          </Link>

          <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7c600] text-xl font-black text-[#08213f]">
            P+
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-blue-700">
            Acesso ao portal
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight text-[#08213f] md:text-5xl">
            Entre para praticar.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
            Use o usuário e a senha gerados pelo professor. O Prática+ não utiliza e-mail para acesso dos alunos.
          </p>

          <LoginForm />

          <div className="mt-8 rounded-[1.5rem] bg-blue-50 p-5">
            <p className="text-sm font-black text-blue-900">
              Professor de teste
            </p>
            <p className="mt-2 text-sm font-semibold text-blue-800">
              Usuário: professor • Senha: professor123
            </p>
          </div>
        </div>

        <div className="hidden min-h-full lg:block">
          <img
            src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80"
            alt="Alunos em ambiente educacional"
            className="h-full w-full object-cover"
          />
        </div>
      </section>
    </main>
  );
}
