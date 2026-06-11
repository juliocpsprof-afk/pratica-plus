import Link from "next/link";

type PortalHeaderProps = {
  currentArea?: "home" | "professor" | "aluno";
};

export function PortalHeader({ currentArea = "home" }: PortalHeaderProps) {
  const linkBase =
    "rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-white/15";

  const active = "bg-white text-blue-900 shadow-sm";
  const inactive = "text-white/85";

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
      <Link href="/" className="group flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-blue-800 shadow-lg shadow-blue-950/20 transition group-hover:scale-105">
          P+
        </div>

        <div>
          <p className="text-lg font-black tracking-tight text-white">Prática+</p>
          <p className="text-xs font-medium text-blue-100">
            Treine hoje. Trabalhe preparado amanhã.
          </p>
        </div>
      </Link>

      <nav className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur md:flex">
        <Link
          href="/"
          className={`${linkBase} ${currentArea === "home" ? active : inactive}`}
        >
          Início
        </Link>

        <Link
          href="/professor"
          className={`${linkBase} ${
            currentArea === "professor" ? active : inactive
          }`}
        >
          Professor
        </Link>

        <Link
          href="/aluno"
          className={`${linkBase} ${currentArea === "aluno" ? active : inactive}`}
        >
          Aluno
        </Link>
      </nav>

      <Link
        href="/login"
        className="rounded-full bg-white px-5 py-3 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50"
      >
        Entrar
      </Link>
    </header>
  );
}
