"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { useData } from "@/contexts/DataContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Clock, Check, X, Coins, ArrowLeft, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toDisplay } from "@/lib/score-display";

const statusMap = {
  PENDING: { label: "待确认", icon: Clock, variant: "neon" as const },
  CONFIRMED: { label: "已兑换", icon: Check, variant: "orange" as const },
  REJECTED: { label: "已拒绝", icon: X, variant: "danger" as const },
  CANCELLED: { label: "已取消", icon: XCircle, variant: "default" as const },
};

type TabFilter = "CONFIRMED" | "REJECTED";

export default function StudentExchangesPage() {
  const { exchanges, isLoading, showPinyin, cancelExchange, baseScore } = useData();
  const [tab, setTab] = useState<TabFilter>("CONFIRMED");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const filtered = exchanges.filter((ex) => ex.status === tab);
  const sorted = [...filtered].sort(
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
      <div className="flex items-center gap-3">
        <Link
          href="/student/rewards"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-s-text-secondary hover:bg-white/10 hover:text-s-text transition-colors"
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-s-text">
        我的兑换
        </h1>
      </div>

      <div className="flex rounded-lg border border-s-primary/20 bg-white/5 p-0.5">
        {(
          [
            { key: "CONFIRMED" as const, label: "成功" },
            { key: "REJECTED" as const, label: "拒绝" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-s-primary/20 text-s-primary"
                : "text-s-text-secondary hover:text-s-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="glass-card p-8 md:p-10 text-center">
          <p className="text-base md:text-lg text-s-text-secondary">
            <TextWithPinyin
              text={tab === "CONFIRMED" ? "暂无成功的兑换" : "暂无被拒绝的兑换"}
              showPinyin={showPinyin}
            />
          </p>
          {tab === "CONFIRMED" && (
            <p className="text-sm md:text-base text-s-text-secondary mt-1">
              <TextWithPinyin text="去奖励商城看看吧" showPinyin={showPinyin} />
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 md:gap-3">
        {sorted.map((ex) => {
          const cfg = statusMap[ex.status as keyof typeof statusMap] ?? statusMap.PENDING;
          return (
            <div key={ex.id} className="glass-card p-4 md:p-5">
              <div className="flex items-start justify-between gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base md:text-lg font-medium text-s-text">
                      <TextWithPinyin text={ex.rewardName} showPinyin={showPinyin} />
                    </p>
                    <Badge variant={cfg.variant}>
                      <cfg.icon size={12} className="mr-1 md:w-3.5 md:h-3.5" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 md:mt-2">
                    <Coins size={16} className="text-s-accent md:w-5 md:h-5" />
                    <span className="text-sm md:text-base text-s-accent">{toDisplay(ex.pointsCost, baseScore)} 积分</span>
                  </div>
                  {ex.rejectReason && (
                    <div className="text-sm md:text-base text-s-danger mt-1.5">
                      <TextWithPinyin text="拒绝原因" showPinyin={showPinyin} />:
                      <div className="mt-0.5">
                        {ex.rejectReason.split("\n").map((line, i) => (
                          <Fragment key={i}>
                            {i > 0 && <br />}
                            <TextWithPinyin text={line} showPinyin={showPinyin} />
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="text-sm md:text-base text-s-text-secondary">
                    {formatDate(ex.createdAt)}
                  </span>
                  {ex.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCancelId(ex.id)}
                    >
                      取消申请
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={async () => {
          if (cancelId) {
            setCancelling(true);
            try {
              await cancelExchange(cancelId);
              setCancelId(null);
            } finally {
              setCancelling(false);
            }
          }
        }}
        title="取消兑换申请"
        message={
          <span>
            <TextWithPinyin text="确定要取消该兑换申请吗？积分将退回可用余额。" showPinyin={showPinyin} />
          </span>
        }
        confirmLabel="确定取消"
        variant="danger"
        loading={cancelling}
      />
    </div>
  );
}
