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
      <div className="min-h-dvh student-bg theme-student">
        <main className="relative z-[1] pb-20 pt-2">
          <div className="mx-auto max-w-lg px-4">{children}</div>
        </main>
      </div>
      <StudentNav />
    </>
  );
}
