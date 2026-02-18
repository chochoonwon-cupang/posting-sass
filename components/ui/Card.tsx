import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
}

export function Card({ children, className = "", hoverLift = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-all duration-200 ${
        hoverLift ? "hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
