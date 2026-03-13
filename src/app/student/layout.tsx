"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PullToRefresh } from "@/components/student/PullToRefresh";
import { StudentNav } from "@/components/student/StudentNav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const { refetch } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <>
      <div className="h-dvh student-bg theme-student flex flex-col overflow-hidden">
        <PullToRefresh
          onRefresh={refetch}
          className="flex-1 min-h-0 overscroll-contain"
        >
          <main className="relative z-[1] safe-area-top pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-2">
            <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-4 md:px-6">{children}</div>
          </main>
        </PullToRefresh>
      </div>
      <StudentNav />
    </>
  );
}
