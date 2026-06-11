import { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark" | "success";
};

export function AppButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: AppButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary:
      "bg-blue-700 text-white shadow-lg shadow-blue-700/25 hover:-translate-y-0.5 hover:bg-blue-800",
    secondary:
      "border border-blue-200 bg-white text-blue-800 shadow-sm hover:-translate-y-0.5 hover:bg-blue-50",
    dark:
      "bg-slate-950 text-white shadow-lg shadow-slate-950/25 hover:-translate-y-0.5 hover:bg-slate-800",
    success:
      "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 hover:bg-emerald-700",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
