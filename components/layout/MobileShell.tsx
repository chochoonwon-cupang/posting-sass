"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const BottomNav = dynamic(
  () => import("./BottomNav").then((m) => ({ default: m.BottomNav })),
  { ssr: false }
);

interface MobileShellProps {
  title: string;
  children: ReactNode;
  showNav?: boolean;
  wide?: boolean;
}

export function MobileShell({
  title,
  children,
  showNav = true,
  wide = false,
}: MobileShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#1e1b4b]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1e1b4b]/95 px-4 py-4 backdrop-blur-sm">
        <h1 className="text-center text-lg font-bold text-white">{title}</h1>
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
