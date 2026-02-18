"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES_WITH_BOTTOM_NAV = ["/dashboard", "/new", "/my", "/subscribe", "/charge", "/settings"];

export function FloatingBanner() {
  const pathname = usePathname();
  const hasBottomNav = PAGES_WITH_BOTTOM_NAV.some((p) => pathname.startsWith(p));

  return (
    <div
      className="fixed left-0 right-0 z-40 border-t border-white/10 bg-[#1e1b4b]/98 px-4 py-3 backdrop-blur-sm"
      style={{ bottom: hasBottomNav ? 60 : 0 }}
    >
      <div className="mx-auto max-w-md">
        <Link
          href="/signup"
          prefetch={false}
          className="block w-full rounded-xl bg-indigo-500 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
        >
          42건 무료 혜택 받기
        </Link>
      </div>
    </div>
  );
}
