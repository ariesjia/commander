"use client";

import { useData } from "@/contexts/DataContext";
import { Badge } from "@/components/ui/Badge";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { Check, Clock, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDisplay } from "@/lib/score-display";

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "neon" | "orange"; color: string }> = {
  pending: { label: "待完成", icon: Clock, variant: "neon", color: "text-s-primary" },
  completed: { label: "已完成", icon: Check, variant: "orange", color: "text-s-success" },
};

export default function StudentTasksPage() {
  const { getTasksWithStatus, showPinyin, isLoading, baseScore } = useData();
  const tasks = getTasksWithStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[40vh] items-center justify-center gap-4 pt-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
        <p className="text-sm text-s-text-secondary">加载中...</p>
      </div>
    );
  }

  const dailyTasks = tasks.filter((t) => t.type === "DAILY");
  const weeklyTasks = tasks.filter((t) => t.type === "WEEKLY");
  const ruleTasks = tasks.filter((t) => t.type === "RULE");

  const renderGroup = (label: string, icon: React.ReactNode, items: typeof tasks) => (
    <div>
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        {icon}
        <h2 className="text-base md:text-lg font-semibold text-s-text">
          {label}
        </h2>
        <span className="text-sm md:text-base text-s-text-secondary">
          ({items.filter((t) => t.status === "completed").length}/{items.length})
        </span>
      </div>
      <div className="flex flex-col gap-2 md:gap-3">
        {items.map((task) => {
          const cfg = statusConfig[task.status] ?? statusConfig.pending;
          return (
            <div
              key={task.id}
              className={cn(
                "glass-card p-4 md:p-5 flex items-center gap-3 md:gap-4 transition-all",
                task.status === "completed" && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg shrink-0",
                  task.status === "completed"
                    ? "bg-s-success/20"
                    : "bg-s-primary/10",
                )}
              >
                <cfg.icon size={20} className={cn("md:w-6 md:h-6", cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-base md:text-lg font-medium text-s-text", task.status === "completed" && "line-through")}>
                  <TextWithPinyin text={task.name} showPinyin={showPinyin} />
                </p>
                {task.description && (
                  <p className="text-sm md:text-base text-s-text-secondary truncate mt-0.5">
                    <TextWithPinyin text={task.description} showPinyin={showPinyin} />
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
                <span className="flex items-center gap-1 text-sm md:text-base">
                  {task.type === "RULE" && (task.penaltyPoints ?? 0) > 0 ? (
                    <span className="text-s-danger">扣分 · 违反扣 {toDisplay(task.penaltyPoints ?? 0, baseScore)} 分</span>
                  ) : (
                    <span className="text-s-success">加分 · 完成可得 {toDisplay(task.maxPoints ?? 0, baseScore)} 分</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6">
      <h1 className="font-display text-xl md:text-2xl font-bold text-s-text">
      任务列表
      </h1>

      {dailyTasks.length > 0 && renderGroup("每日任务", <CalendarDays size={20} className="text-s-primary md:w-6 md:h-6" />, dailyTasks)}
      {weeklyTasks.length > 0 && renderGroup("每周任务", <CalendarRange size={20} className="text-s-primary md:w-6 md:h-6" />, weeklyTasks)}
      {ruleTasks.length > 0 && renderGroup("规则", <span className="text-lg md:text-xl">📋</span>, ruleTasks)}

      {tasks.length === 0 && (
        <div className="glass-card p-8 md:p-10 text-center">
          <p className="text-base md:text-lg text-s-text-secondary">
            <TextWithPinyin text="暂无任务" showPinyin={showPinyin} />
          </p>
          <p className="text-sm md:text-base text-s-text-secondary mt-1">
            <TextWithPinyin text="等待家长配置任务" showPinyin={showPinyin} />
          </p>
        </div>
      )}
    </div>
  );
}
