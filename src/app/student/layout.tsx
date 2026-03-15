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
      <div className="min-h-dvh student-bg theme-student flex flex-col">
        <PullToRefresh
          onRefresh={refetch}
          className="flex-1 min-h-0 overscroll-contain"
        >
          <main className="relative z-[1] pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
            <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:pl-6 md:pr-6">
              {children}
            </div>
          </main>
        </PullToRefresh>
      </div>
      <StudentNav />
    </>
  );
}
