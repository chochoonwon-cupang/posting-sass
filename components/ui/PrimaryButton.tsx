import { ButtonHTMLAttributes } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  fullWidth = true,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`flex min-h-14 items-center justify-center rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
