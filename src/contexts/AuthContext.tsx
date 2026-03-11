"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ParentUser } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  isLoggedIn: boolean;
  user: ParentUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, pin: string, childNickname: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePin: (newPin: string) => Promise<void>;
  updateNickname: (name: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const data = await api.get<{ user: { email: string; childNickname: string } | null }>("/api/auth/session");
      if (data.user) {
        setUser({ email: data.user.email, pin: "", childNickname: data.user.childNickname });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setReady(true));
  }, [refreshSession]);

  const register = useCallback(
    async (email: string, password: string, pin: string, childNickname: string) => {
      const data = await api.post<{ success: boolean; user?: { email: string; childNickname: string } }>(
        "/api/auth/register",
        { email, password, pin, childNickname }
      );
      if (data.success && data.user) {
        setUser({ email: data.user.email, pin: "", childNickname: data.user.childNickname });
        return true;
      }
      return false;
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await api.post<{ success: boolean; user?: { email: string; childNickname: string } }>(
        "/api/auth/login",
        { email, password }
      );
      if (data.success && data.user) {
        setUser({ email: data.user.email, pin: "", childNickname: data.user.childNickname });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  }, []);

  const updatePin = useCallback(async (newPin: string) => {
    await api.put("/api/parent/pin", { pin: newPin });
    if (user) setUser({ ...user });
  }, [user]);

  const updateNickname = useCallback(async (name: string) => {
    await api.put("/api/parent/student", { nickname: name });
    if (user) setUser({ ...user, childNickname: name });
  }, [user]);

  if (!ready) return null;

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!user,
        user,
        login,
        register,
        logout,
        updatePin,
        updateNickname,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
