"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSession } from "@/lib/session/session.client";
import { loginWithUsername } from "@/services/login.service";

export function LoginForm() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    try {
      setError("");

      if (!username.trim()) {
        setError("Informe o usuário.");
        return;
      }

      if (!password.trim()) {
        setError("Informe a senha.");
        return;
      }

      setIsLoading(true);

      const session = await loginWithUsername({
        username,
        password,
      });

      saveSession(session);

      if (session.role === "professor") {
        router.push("/professor");
        return;
      }

      router.push("/aluno");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível acessar o sistema."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="mt-8 max-w-md space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        handleLogin();
      }}
    >
      <div>
        <label className="mb-2 block text-sm font-black text-slate-700">
          Usuário
        </label>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          type="text"
          placeholder="ex: joaodasilva"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-black text-slate-700">
          Senha
        </label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="ex: joao123"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Entrando..." : "Acessar sistema"}
      </button>
    </form>
  );
}
