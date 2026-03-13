"use client";

import { useData } from "@/contexts/DataContext";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, RotateCcw, Coins } from "lucide-react";

const typeIcons: Record<string, typeof TrendingUp> = {
  TASK_REWARD: TrendingUp,
  TASK_REWARD_UNDO: RotateCcw,
  TASK_PENALTY: TrendingDown,
  TASK_PENALTY_UNDO: RotateCcw,
  EXCHANGE_COST: TrendingDown,
  EXCHANGE_REFUND: RotateCcw,
};

const typeColors: Record<string, string> = {
  TASK_REWARD: "text-s-success bg-s-success/10",
  TASK_REWARD_UNDO: "text-amber-600 bg-amber-50",
  TASK_PENALTY: "text-s-danger bg-s-danger/10",
  TASK_PENALTY_UNDO: "text-s-primary bg-s-primary/10",
  EXCHANGE_COST: "text-s-danger bg-s-danger/10",
  EXCHANGE_REFUND: "text-s-primary bg-s-primary/10",
};

const typeLabels: Record<string, string> = {
  TASK_REWARD: "加分",
  TASK_REWARD_UNDO: "扣分",
  TASK_PENALTY: "扣分",
  TASK_PENALTY_UNDO: "加分",
  EXCHANGE_COST: "扣分",
  EXCHANGE_REFUND: "加分",
};

export default function StudentPointsPage() {
  const { pointsLogs, student, showPinyin, isLoading } = useData();
  const sorted = [...pointsLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[40vh] items-center justify-center gap-4 pt-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
        <p className="text-sm text-s-text-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl md:text-2xl font-bold text-s-text">
        积分记录
        </h1>
        <div className="flex items-center gap-1.5">
          <Coins size={20} className="text-s-accent md:w-6 md:h-6" />
          <span className="font-display text-base md:text-lg font-bold text-s-accent">
            {student.balance}
          </span>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="glass-card p-8 md:p-10 text-center">
          <p className="text-base md:text-lg text-s-text-secondary">
            <TextWithPinyin text="暂无积分记录" showPinyin={showPinyin} />
          </p>
          <p className="text-sm md:text-base text-s-text-secondary mt-1">
            <TextWithPinyin text="完成任务后积分会在这里显示" showPinyin={showPinyin} />
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((log) => {
          const Icon = typeIcons[log.type] ?? TrendingUp;
          const color = typeColors[log.type] ?? "text-gray-600 bg-gray-50";
          const label = typeLabels[log.type] ?? (log.amount > 0 ? "加分" : "扣分");
          const isAdd = log.amount > 0;
          return (
            <div key={log.id} className="glass-card p-4 md:p-5 flex items-center gap-3 md:gap-4">
              <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg shrink-0 ${color}`}>
                <Icon size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base md:text-lg text-s-text truncate">
                  <TextWithPinyin text={log.description} showPinyin={showPinyin} />
                </p>
                <p className="text-sm md:text-base text-s-text-secondary">{formatDate(log.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-sm md:text-base font-medium mr-1.5 ${
                    isAdd ? "bg-s-success/20 text-s-success" : "bg-s-danger/20 text-s-danger"
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`font-display text-base md:text-lg font-bold ${
                    isAdd ? "text-s-success" : "text-s-danger"
                  }`}
                >
                  {isAdd ? "+" : ""}
                  {log.amount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
