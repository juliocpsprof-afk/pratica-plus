import { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen">
      <div className="py-6 md:py-8">{children}</div>
    </main>
  );
}
