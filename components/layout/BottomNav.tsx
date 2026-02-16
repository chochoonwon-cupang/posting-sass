"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "홈", icon: "🏠" },
  { href: "/new", label: "등록", icon: "✏️" },
  { href: "/my", label: "내목록", icon: "📋" },
  { href: "/subscribe", label: "정기구독", icon: "🛒", iconComponent: CreditCard },
  { href: "/charge", label: "충전", icon: "💰" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const IconComponent = "iconComponent" in item ? item.iconComponent : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-colors ${
                isActive ? "bg-indigo-50 text-indigo-600" : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {IconComponent ? (
                <IconComponent className="h-5 w-5" />
              ) : (
                <span className="text-xl">{item.icon}</span>
              )}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
