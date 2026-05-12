"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { StudentNav } from "@/components/student/StudentNav";
import { cn } from "@/lib/utils";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const { isLoading } = useData();
  const router = useRouter();
  const pathname = usePathname();
  const isBigScreen = pathname === "/student/big-screen";

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <>
      {/* h-dvh + overflow-hidden：限制高度，否则 flex 子项随内容撑开，内部无法出现纵向滚动 */}
      <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden student-bg theme-student">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <main
            className={cn(
              "relative z-[1] min-h-screen pt-[calc(0.75rem+env(safe-area-inset-top,0px))]",
              isBigScreen
                ? "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
                : "pb-[calc(7rem+env(safe-area-inset-bottom,0px))]",
            )}
          >
            <div
              className={cn(
                "mx-auto pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:pl-6 md:pr-6",
                isBigScreen ? "max-w-[min(100vw,120rem)]" : "max-w-lg md:max-w-2xl lg:max-w-4xl",
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
      {!isLoading && !isBigScreen && <StudentNav />}
    </>
  );
}
