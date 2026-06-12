import { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
};

export function AppButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: AppButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary: "bg-[#08213f] text-white hover:bg-blue-800",
    secondary:
      "border border-slate-200 bg-white text-[#08213f] hover:bg-blue-50",
    danger: "bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
