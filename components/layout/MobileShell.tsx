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
}

export function MobileShell({
  title,
  children,
  showNav = true,
}: MobileShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white px-4 py-4">
        <h1 className="text-center text-lg font-bold text-zinc-900">{title}</h1>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4">
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}
