"use client";

import { AuthProvider } from "./AuthContext";
import { ModeProvider } from "./ModeContext";
import { DataProvider } from "./DataContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ModeProvider>
        <DataProvider>{children}</DataProvider>
      </ModeProvider>
    </AuthProvider>
  );
}
