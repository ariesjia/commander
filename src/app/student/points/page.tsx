"use client";

import { useData } from "@/contexts/DataContext";
import { formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, RotateCcw, Coins } from "lucide-react";

const typeIcons = {
  TASK_REWARD: TrendingUp,
  EXCHANGE_COST: TrendingDown,
  EXCHANGE_REFUND: RotateCcw,
};

const typeColors = {
  TASK_REWARD: "text-s-success bg-s-success/10",
  EXCHANGE_COST: "text-s-danger bg-s-danger/10",
  EXCHANGE_REFUND: "text-s-primary bg-s-primary/10",
};

export default function StudentPointsPage() {
  const { pointsLogs, student } = useData();
  const sorted = [...pointsLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-bold text-s-text">
          积分记录
        </h1>
        <div className="flex items-center gap-1.5">
          <Coins size={16} className="text-s-accent" />
          <span className="font-display text-sm font-bold text-s-accent">
            {student.balance}
          </span>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-s-text-secondary">暂无积分记录</p>
          <p className="text-xs text-s-text-secondary mt-1">完成任务后积分会在这里显示</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((log) => {
          const Icon = typeIcons[log.type];
          const color = typeColors[log.type];
          return (
            <div key={log.id} className="glass-card p-3 flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${color}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-s-text truncate">{log.description}</p>
                <p className="text-xs text-s-text-secondary">{formatDate(log.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`font-display text-sm font-bold ${
                    log.amount > 0 ? "text-s-success" : "text-s-danger"
                  }`}
                >
                  {log.amount > 0 ? "+" : ""}
                  {log.amount}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
