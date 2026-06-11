import { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  background?: "light" | "dark";
};

export function AppShell({ children, background = "light" }: AppShellProps) {
  const bg =
    background === "dark"
      ? "bg-[#061b35] text-white"
      : "bg-[#f4f8fc] text-slate-950";

  return <main className={`min-h-screen ${bg}`}>{children}</main>;
}
