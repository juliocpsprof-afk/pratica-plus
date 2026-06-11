import Link from "next/link";

export function PublicNavbar() {
  return (
    <header className="relative z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7c600] text-lg font-black text-[#08213f]">
            P+
          </div>

          <div>
            <p className="text-lg font-black leading-none text-[#08213f]">
              Prática+
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Simulador profissional
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-bold text-[#08213f] hover:text-blue-700">
            Início
          </Link>
          <Link href="/aluno/simulacoes" className="text-sm font-bold text-[#08213f] hover:text-blue-700">
            Simuladores
          </Link>
          <Link href="/professor" className="text-sm font-bold text-[#08213f] hover:text-blue-700">
            Professor
          </Link>
          <Link href="/aluno" className="text-sm font-bold text-[#08213f] hover:text-blue-700">
            Aluno
          </Link>
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-[#f7c600] px-5 py-3 text-sm font-black text-[#08213f] transition hover:bg-[#ffd72e]"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
