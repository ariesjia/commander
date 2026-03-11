"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Delete } from "lucide-react";

interface PinDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  verifyPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
}

export function PinDialog({ open, onClose, onSuccess, verifyPin }: PinDialogProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  useEffect(() => {
    if (!open) {
      setDigits(["", "", "", ""]);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => {
      if (Date.now() >= lockedUntil!) {
        setLockedUntil(null);
        setAttempts(0);
        setError("");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked, lockedUntil]);

  const tryVerify = useCallback(
    async (newDigits: string[]) => {
      const pin = newDigits.join("");
      if (pin.length !== 4) return;

      setLoading(true);
      setError("");
      try {
        const result = await verifyPin(pin);
        if (result.success) {
          setAttempts(0);
          onSuccess();
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setError(result.error ?? `密码错误 (${newAttempts}/5)`);
          if (result.error?.includes("1 分钟")) {
            setLockedUntil(Date.now() + 60_000);
          }
          setTimeout(() => setDigits(["", "", "", ""]), 300);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "验证失败");
        setTimeout(() => setDigits(["", "", "", ""]), 300);
      } finally {
        setLoading(false);
      }
    },
    [verifyPin, attempts, onSuccess]
  );

  const pressDigit = (d: string) => {
    if (isLocked || loading) return;
    setError("");
    const idx = digits.findIndex((v) => v === "");
    if (idx === -1) return;
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (idx === 3) tryVerify(next);
  };

  const pressDelete = () => {
    if (isLocked || loading) return;
    setError("");
    const lastIdx = digits.reduce((acc, v, i) => (v !== "" ? i : acc), -1);
    if (lastIdx === -1) return;
    const next = [...digits];
    next[lastIdx] = "";
    setDigits(next);
  };

  const remainingSeconds = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Lock size={20} className="text-p-primary" />
              </div>
              <p className="text-sm font-medium text-p-text">输入PIN码切回家长模式</p>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-4 mb-4">
              {digits.map((d, i) => (
                <div
                  key={i}
                  className={`h-12 w-12 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-all duration-150 ${
                    d
                      ? "border-p-accent bg-p-accent/10 text-p-accent"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {d ? "\u2022" : ""}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-center text-sm text-p-danger mb-3">
                {isLocked ? `${error} (${remainingSeconds}s)` : error}
              </p>
            )}

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((key) => {
                if (key === "")
                  return <div key="empty" />;
                if (key === "del")
                  return (
                    <button
                      key="del"
                      onClick={pressDelete}
                      disabled={loading}
                      className="flex h-14 items-center justify-center rounded-xl text-p-text-secondary hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Delete size={20} />
                    </button>
                  );
                return (
                  <button
                    key={key}
                    onClick={() => pressDigit(key)}
                    disabled={isLocked || loading}
                    className="flex h-14 items-center justify-center rounded-xl text-lg font-semibold text-p-text hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="mt-4 w-full text-center text-sm text-p-text-secondary hover:text-p-text transition-colors cursor-pointer disabled:opacity-50"
            >
              取消
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
