import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

type AlunoLayoutProps = {
  children: ReactNode;
};

export default function AlunoLayout({ children }: AlunoLayoutProps) {
  return (
    <ProtectedRoute allowedRole="aluno">
      {children}
    </ProtectedRoute>
  );
}
