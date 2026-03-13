"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TrendingUp, TrendingDown, RotateCcw, Coins, Undo2 } from "lucide-react";

const typeIcons: Record<string, typeof TrendingUp> = {
  TASK_REWARD: TrendingUp,
  TASK_REWARD_UNDO: RotateCcw,
  TASK_PENALTY: TrendingDown,
  TASK_PENALTY_UNDO: RotateCcw,
  EXCHANGE_COST: TrendingDown,
  EXCHANGE_REFUND: RotateCcw,
};

const typeColors: Record<string, string> = {
  TASK_REWARD: "text-green-600 bg-green-50",
  TASK_REWARD_UNDO: "text-amber-600 bg-amber-50",
  TASK_PENALTY: "text-red-500 bg-red-50",
  TASK_PENALTY_UNDO: "text-blue-500 bg-blue-50",
  EXCHANGE_COST: "text-red-500 bg-red-50",
  EXCHANGE_REFUND: "text-blue-500 bg-blue-50",
};

const typeLabels: Record<string, string> = {
  TASK_REWARD: "加分",
  TASK_REWARD_UNDO: "扣分",
  TASK_PENALTY: "扣分",
  TASK_PENALTY_UNDO: "加分",
  EXCHANGE_COST: "扣分",
  EXCHANGE_REFUND: "加分",
};

export default function ParentPointsLogPage() {
  const { pointsLogs, student, undoPointsLog } = useData();
  const { toast } = useToast();
  const [undoLogId, setUndoLogId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  const sorted = [...pointsLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const canUndo = (type: string) =>
    type === "TASK_REWARD" || type === "TASK_PENALTY";

  const isUndoRecord = (type: string) =>
    type === "TASK_REWARD_UNDO" || type === "TASK_PENALTY_UNDO";

  const handleUndo = async () => {
    if (undoLogId) {
      setUndoing(true);
      try {
        await undoPointsLog(undoLogId);
        toast("已撤销");
        setUndoLogId(null);
      } catch (e) {
        toast(e instanceof Error ? e.message : "撤销失败", "error");
      } finally {
        setUndoing(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
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
          const label = typeLabels[log.type] ?? (log.amount > 0 ? "加分" : "扣分");
          const isAdd = log.amount > 0;
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
              <div className="flex items-center gap-2 shrink-0">
                {isUndoRecord(log.type) ? (
                  <span className="text-xs text-p-text-secondary">已撤销</span>
                ) : (
                  <div className="text-right">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium mr-1.5 ${
                        isAdd ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isAdd ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {isAdd ? "+" : ""}
                      {log.amount}
                    </span>
                    <p className="text-xs text-p-text-secondary mt-0.5">余额 {log.balance}</p>
                  </div>
                )}
                {canUndo(log.type) && (
                  <Button size="sm" variant="secondary" onClick={() => setUndoLogId(log.id)}>
                    <Undo2 size={14} className="mr-1" />
                    撤销
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!undoLogId}
        onClose={() => setUndoLogId(null)}
        onConfirm={handleUndo}
        title="撤销积分记录"
        message="确定撤销此记录？将反向扣减/增加儿童积分及机甲积分。"
        confirmLabel="确认撤销"
        variant="danger"
        loading={undoing}
      />
    </div>
  );
}
