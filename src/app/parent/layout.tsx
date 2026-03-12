"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ParentNav } from "@/components/parent/ParentNav";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-dvh bg-p-bg theme-parent">
      <ParentNav />
      <main className="pb-[calc(4rem+env(safe-area-inset-bottom,0px))] pt-4 sm:pb-8 sm:pl-56">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
