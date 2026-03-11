"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppMode } from "@/types";
import { api } from "@/lib/api";

interface ModeState {
  mode: AppMode;
  switchToStudent: () => Promise<void>;
  switchToParent: (pin: string) => Promise<{ success: boolean; error?: string }>;
  isTransitioning: boolean;
  setTransitioning: (v: boolean) => void;
}

const ModeContext = createContext<ModeState | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>("parent");
  const [isTransitioning, setTransitioning] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .get<{ mode: AppMode | null; loggedIn: boolean }>("/api/mode/current")
      .then((data) => {
        if (data.loggedIn && data.mode) {
          setMode(data.mode);
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const switchToStudent = useCallback(async () => {
    await api.post("/api/mode/switch");
    setMode("student");
  }, []);

  const switchToParent = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await api.post<{ success: boolean }>("/api/mode/verify-pin", { pin });
      if (data.success) {
        setMode("parent");
        return { success: true };
      }
      return { success: false, error: "PIN 码错误" };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "验证失败" };
    }
  }, []);

  if (!ready) return null;

  return (
    <ModeContext.Provider
      value={{ mode, switchToStudent, switchToParent, isTransitioning, setTransitioning }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
