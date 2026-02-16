"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-lg">
      {message}
    </div>
  );
}
