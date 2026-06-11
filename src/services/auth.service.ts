import { generatePassword } from "@/lib/auth/generatePassword";
import { generateUsername } from "@/lib/auth/generateUsername";
import { GeneratedAccess } from "@/types";

export function generateStudentAccess(fullName: string): GeneratedAccess {
  return {
    fullName,
    username: generateUsername(fullName),
    password: generatePassword(fullName),
  };
}

export function validateLoginFields(username: string, password: string): string | null {
  if (!username.trim()) {
    return "Informe o usuário.";
  }

  if (!password.trim()) {
    return "Informe a senha.";
  }

  return null;
}
