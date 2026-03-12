"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ListChecks, Gift, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/student", label: "机甲", icon: Bot },
  { href: "/student/tasks", label: "任务", icon: ListChecks },
  { href: "/student/rewards", label: "奖励", icon: Gift },
  { href: "/student/points", label: "积分", icon: ScrollText },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav className="theme-student fixed bottom-0 left-0 right-0 z-50 flex min-h-16 items-center justify-around border-t border-[rgba(0,212,255,0.15)] bg-[#0c1222]/95 backdrop-blur-lg safe-area-bottom">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1.5 px-3 py-1.5 text-xs transition-all cursor-pointer min-w-[56px]",
              active
                ? "text-s-primary"
                : "text-s-text-secondary hover:text-s-text",
            )}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={active ? 2.2 : 1.5} />
              {active && (
                <div className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-s-primary shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
              )}
            </div>
            <span className={cn(active && "neon-text")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
