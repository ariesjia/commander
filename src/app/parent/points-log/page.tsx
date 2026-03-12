"use client";

import { useData } from "@/contexts/DataContext";
import { formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, RotateCcw, Coins } from "lucide-react";

const typeIcons: Record<string, typeof TrendingUp> = {
  TASK_REWARD: TrendingUp,
  EXCHANGE_COST: TrendingDown,
  EXCHANGE_REFUND: RotateCcw,
};

const typeColors: Record<string, string> = {
  TASK_REWARD: "text-green-600 bg-green-50",
  EXCHANGE_COST: "text-red-500 bg-red-50",
  EXCHANGE_REFUND: "text-blue-500 bg-blue-50",
};

export default function ParentPointsLogPage() {
  const { pointsLogs, student } = useData();
  const sorted = [...pointsLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-p-text">积分记录</h1>
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm">
          <Coins size={14} className="text-amber-500" />
          <span className="font-semibold text-amber-700">{student.balance}</span>
          <span className="text-amber-600/70">可用</span>
        </div>
      </div>

      {sorted.length === 0 && (
        <p className="py-12 text-center text-sm text-p-text-secondary">暂无积分记录</p>
      )}

      <div className="flex flex-col gap-1.5">
        {sorted.map((log) => {
          const Icon = typeIcons[log.type] ?? TrendingUp;
          const color = typeColors[log.type] ?? "text-gray-600 bg-gray-50";
          return (
            <div
              key={log.id}
              className="flex items-center gap-3 rounded-xl border border-p-border bg-p-card p-3"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${color}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-p-text truncate">{log.description}</p>
                <p className="text-xs text-p-text-secondary">{formatDate(log.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-semibold ${
                    log.amount > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {log.amount > 0 ? "+" : ""}
                  {log.amount}
                </p>
                <p className="text-xs text-p-text-secondary">余额 {log.balance}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
