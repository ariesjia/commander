"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StudentNav } from "@/components/student/StudentNav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <>
      <div className="min-h-dvh min-h-[100dvh] student-bg theme-student">
        <main className="relative z-[1] safe-area-top pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-2">
          <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-4 md:px-6">{children}</div>
        </main>
      </div>
      <StudentNav />
    </>
  );
}
