"use client";
// =====================================================
// AksharaChitra — Toast Notification System
// =====================================================

import { useCallback, useEffect, useRef, useState } from "react";

interface Toast {
  id: number;
  message: string;
  color: string;
}

let _toastCounter = 0;
let _globalAddToast: ((msg: string, color?: string) => void) | null = null;

/** Call this from anywhere (non-React code) to show a toast */
export function showToast(msg: string, color = "#4CAF50") {
  _globalAddToast?.(msg, color);
}

export function useToastManager() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((msg: string, color = "#4CAF50") => {
    const id = ++_toastCounter;
    setToasts((prev) => [...prev, { id, message: msg, color }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  // Register globally so showToast() utility can call it
  useEffect(() => {
    _globalAddToast = addToast;
    return () => {
      _globalAddToast = null;
    };
  }, [addToast]);

  return { toasts, addToast };
}

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.color,
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            fontFamily: "Montserrat, sans-serif",
            fontSize: "0.88rem",
            fontWeight: 600,
            animation: "ak-toast-in 0.25s ease",
            whiteSpace: "nowrap",
          }}
        >
          {t.message}
        </div>
      ))}

      <style>{`
        @keyframes ak-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
