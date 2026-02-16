"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      )}
    </label>
  );
}
