"use client";

import { useData } from "@/contexts/DataContext";
import { Badge } from "@/components/ui/Badge";
import { Check, Clock, AlertCircle, CalendarDays, CalendarRange, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "待完成", icon: Clock, variant: "neon" as const, color: "text-s-primary" },
  completed: { label: "已完成", icon: Check, variant: "orange" as const, color: "text-s-success" },
  expired: { label: "已过期", icon: AlertCircle, variant: "danger" as const, color: "text-s-danger" },
};

export default function StudentTasksPage() {
  const { getTasksWithStatus } = useData();
  const tasks = getTasksWithStatus();

  const dailyTasks = tasks.filter((t) => t.type === "DAILY");
  const weeklyTasks = tasks.filter((t) => t.type === "WEEKLY");

  const renderGroup = (label: string, icon: React.ReactNode, items: typeof tasks) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-semibold text-s-text">{label}</h2>
        <span className="text-xs text-s-text-secondary">
          ({items.filter((t) => t.status === "completed").length}/{items.length})
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((task) => {
          const cfg = statusConfig[task.status];
          return (
            <div
              key={task.id}
              className={cn(
                "glass-card p-4 flex items-center gap-3 transition-all",
                task.status === "completed" && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                  task.status === "completed"
                    ? "bg-s-success/20"
                    : task.status === "expired"
                      ? "bg-s-danger/20"
                      : "bg-s-primary/10",
                )}
              >
                <cfg.icon size={16} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium text-s-text", task.status === "completed" && "line-through")}>
                  {task.name}
                </p>
                {task.description && (
                  <p className="text-xs text-s-text-secondary truncate mt-0.5">{task.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
                <span className="flex items-center gap-1 text-xs text-s-accent">
                  <Coins size={10} />+{task.points}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pt-2">
      <h1 className="font-display text-lg font-bold text-s-text">
        任务列表
      </h1>

      {tasks.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-s-text-secondary">暂无任务</p>
          <p className="text-xs text-s-text-secondary mt-1">等待家长配置任务</p>
        </div>
      )}

      {dailyTasks.length > 0 &&
        renderGroup("每日任务", <CalendarDays size={16} className="text-s-primary" />, dailyTasks)}
      {weeklyTasks.length > 0 &&
        renderGroup("每周任务", <CalendarRange size={16} className="text-s-accent" />, weeklyTasks)}
    </div>
  );
}
