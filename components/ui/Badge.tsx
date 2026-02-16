type BadgeVariant = "waiting" | "progress" | "completed";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  waiting: "bg-amber-100 text-amber-800",
  progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
