"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, UserCircle } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "홈", icon: "🏠" },
  { href: "/new", label: "등록", icon: "✏️" },
  { href: "/my", label: "내목록", icon: "📋" },
  { href: "/subscribe", label: "정기구독", icon: "🛒", iconComponent: CreditCard },
  { href: "/charge", label: "충전", icon: "💰" },
  { href: "/settings", label: "내정보", iconComponent: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#1e1b4b]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const IconComponent = "iconComponent" in item ? item.iconComponent : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-colors ${
                isActive ? "bg-indigo-500/30 text-indigo-200" : "text-zinc-400 hover:bg-white/5 hover:text-white"
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
