import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

type ProfessorLayoutProps = {
  children: ReactNode;
};

export default function ProfessorLayout({ children }: ProfessorLayoutProps) {
  return (
    <ProtectedRoute allowedRole="professor">
      {children}
    </ProtectedRoute>
  );
}
