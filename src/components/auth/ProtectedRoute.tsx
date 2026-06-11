"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getSession } from "@/lib/session/session.client";
import { AppUserRole } from "@/lib/session/session.types";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRole: AppUserRole;
};

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.role !== allowedRole) {
      router.replace(session.role === "professor" ? "/professor" : "/aluno");
      return;
    }

    setIsAllowed(true);
    setIsChecking(false);
  }, [allowedRole, router]);

  if (isChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f8fc] px-6">
        <section className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7c600] text-xl font-black text-[#08213f]">
            P+
          </div>

          <h1 className="mt-6 text-2xl font-black text-[#08213f]">
            Verificando acesso...
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Estamos conferindo sua sessão antes de liberar a área.
          </p>
        </section>
      </main>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}
