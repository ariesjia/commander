"use client";

import { AuthProvider } from "./AuthContext";
import { ModeProvider } from "./ModeContext";
import { DataProvider } from "./DataContext";
import { ToastProvider } from "./ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ModeProvider>
        <DataProvider>
          <ToastProvider>{children}</ToastProvider>
        </DataProvider>
      </ModeProvider>
    </AuthProvider>
  );
}
