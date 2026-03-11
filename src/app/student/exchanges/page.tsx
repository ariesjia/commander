"use client";

import { useData } from "@/contexts/DataContext";
import { Badge } from "@/components/ui/Badge";
import { Clock, Check, X, Coins } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const statusMap = {
  PENDING: { label: "待确认", icon: Clock, variant: "neon" as const },
  CONFIRMED: { label: "已兑换", icon: Check, variant: "orange" as const },
  REJECTED: { label: "已拒绝", icon: X, variant: "danger" as const },
};

export default function StudentExchangesPage() {
  const { exchanges } = useData();
  const sorted = [...exchanges].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="font-display text-lg font-bold text-s-text">
        我的兑换
      </h1>

      {sorted.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-s-text-secondary">暂无兑换记录</p>
          <p className="text-xs text-s-text-secondary mt-1">去奖励商城看看吧</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((ex) => {
          const cfg = statusMap[ex.status];
          return (
            <div key={ex.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-s-text">{ex.rewardName}</p>
                    <Badge variant={cfg.variant}>
                      <cfg.icon size={10} className="mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Coins size={12} className="text-s-accent" />
                    <span className="text-xs text-s-accent">{ex.pointsCost} 积分</span>
                  </div>
                  {ex.rejectReason && (
                    <p className="text-xs text-s-danger mt-1.5">
                      拒绝原因: {ex.rejectReason}
                    </p>
                  )}
                </div>
                <span className="text-xs text-s-text-secondary shrink-0">
                  {formatDate(ex.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
