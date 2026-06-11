import { AppSession } from "@/lib/session/session.types";

type LoginInput = {
  username: string;
  password: string;
};

export async function loginWithUsername(
  input: LoginInput
): Promise<AppSession> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Não foi possível entrar.");
  }

  return data as AppSession;
}
