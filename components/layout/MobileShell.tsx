"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { PostingLogo } from "@/components/PostingLogo";

const BottomNav = dynamic(
  () => import("./BottomNav").then((m) => ({ default: m.BottomNav })),
  { ssr: false }
);

interface MobileShellProps {
  title: string;
  children: ReactNode;
  showNav?: boolean;
  wide?: boolean;
  headerRight?: ReactNode;
  showLogo?: boolean;
}

export function MobileShell({
  title,
  children,
  showNav = true,
  wide = false,
  headerRight,
  showLogo = false,
}: MobileShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#1e1b4b]">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-white/10 bg-[#1e1b4b]/95 px-4 py-4 backdrop-blur-sm">
        <h1 className="flex items-center gap-2 text-left text-base font-bold text-white md:text-lg">
          {showLogo && <PostingLogo className="h-6 w-6 shrink-0 md:h-7 md:w-7" />}
          {title}
        </h1>
        {headerRight && <div className="flex shrink-0 items-center gap-2">{headerRight}</div>}
      </header>

      <main
        className={`mx-auto w-full flex-1 px-4 pb-24 pt-4 ${wide ? "max-w-4xl" : "max-w-md"}`}
      >
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}
