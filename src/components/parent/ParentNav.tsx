"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Gift, ScrollText, Settings, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMode } from "@/contexts/ModeContext";
import { useRouter } from "next/navigation";

const links = [
  { href: "/parent", label: "总览", icon: LayoutDashboard },
  { href: "/parent/mecha", label: "机甲", icon: Bot },
  { href: "/parent/tasks", label: "任务", icon: ListChecks },
  { href: "/parent/rewards", label: "奖励", icon: Gift },
  { href: "/parent/points-log", label: "积分", icon: ScrollText },
  { href: "/parent/settings", label: "设置", icon: Settings },
];

export function ParentNav() {
  const pathname = usePathname();
  const { switchToStudent, setTransitioning } = useMode();
  const router = useRouter();

  const handleSwitch = async () => {
    try {
      await switchToStudent();
      setTransitioning(true);
      await new Promise((r) => setTimeout(r, 800));
      router.push("/student");
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b border-p-border bg-white/80 px-4 backdrop-blur-md sm:px-6 safe-header-height">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={28} height={28} className="shrink-0" />
          <span className="text-base font-semibold text-p-text">MotiMech</span>
        </div>
        <button
          onClick={handleSwitch}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <Bot size={16} />
          <span className="hidden sm:inline">切换到学生模式</span>
          <span className="sm:hidden">学生模式</span>
        </button>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex min-h-16 items-center justify-around border-t border-p-border bg-white sm:hidden safe-area-bottom">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors cursor-pointer",
                active ? "text-p-accent" : "text-p-text-secondary hover:text-p-primary",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar (tablet+) */}
      <aside className="fixed left-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0 z-30 hidden w-56 border-r border-p-border bg-white sm:block">
        <nav className="flex flex-col gap-1 p-3 pt-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-p-accent/10 text-p-accent"
                    : "text-p-text-secondary hover:bg-gray-50 hover:text-p-text",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
