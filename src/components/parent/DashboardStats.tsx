"use client";

import { Coins, ListChecks, Clock, Flame } from "lucide-react";

interface StatsProps {
  balance: number;
  weeklyCompleted: number;
  weeklyTotal: number;
  pendingCount: number;
  streakDays: number;
}

export function DashboardStats({
  balance,
  weeklyCompleted,
  weeklyTotal,
  pendingCount,
  streakDays,
}: StatsProps) {
  const cards = [
    {
      label: "当前积分",
      value: balance,
      icon: Coins,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "本周完成",
      value: `${weeklyCompleted}/${weeklyTotal}`,
      icon: ListChecks,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "待处理",
      value: pendingCount,
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "连续天数",
      value: `${streakDays}天`,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-p-border bg-p-card p-4 transition-shadow hover:shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
              <c.icon size={16} className={c.color} />
            </div>
          </div>
          <p className="text-2xl font-bold text-p-text">{c.value}</p>
          <p className="text-xs text-p-text-secondary mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
