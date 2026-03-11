"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/Button";
import { Coins, ShoppingCart, ArrowRight, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function StudentRewardsPage() {
  const { rewards, student, requestExchange } = useData();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const activeRewards = rewards.filter((r) => r.isActive).sort((a, b) => a.points - b.points);
  const available = student.balance - student.frozenPoints;

  const handleExchange = async (rewardId: string) => {
    const ok = await requestExchange(rewardId);
    if (ok) {
      setConfirmId(null);
      setSuccessId(rewardId);
      setTimeout(() => setSuccessId(null), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-bold text-s-text">
          奖励商城
        </h1>
        <div className="flex items-center gap-1.5 text-s-accent">
          <Coins size={16} />
          <span className="font-display text-sm font-bold">{available}</span>
          <span className="text-xs text-s-text-secondary">可用</span>
        </div>
      </div>

      {/* Link to exchanges */}
      <Link
        href="/student/exchanges"
        className="glass-card flex items-center justify-between p-3 cursor-pointer hover:border-s-primary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-s-primary" />
          <span className="text-sm text-s-text">我的兑换记录</span>
        </div>
        <ArrowRight size={14} className="text-s-text-secondary" />
      </Link>

      <div className="flex flex-col gap-3">
        {activeRewards.map((reward) => {
          const canAfford = available >= reward.points;
          const deficit = reward.points - available;
          const isSuccess = successId === reward.id;

          return (
            <motion.div
              key={reward.id}
              layout
              className={cn(
                "glass-card p-4 transition-all",
                !canAfford && "opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                {reward.imageUrl ? (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="h-10 w-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                      canAfford ? "bg-s-accent/20" : "bg-white/5",
                    )}
                  >
                    <ShoppingCart size={18} className={canAfford ? "text-s-accent" : "text-s-text-secondary"} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-s-text">{reward.name}</p>
                  {reward.description && (
                    <p className="text-xs text-s-text-secondary mt-0.5">{reward.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    <Coins size={12} className="text-s-accent" />
                    <span className="text-xs font-bold text-s-accent">{reward.points} 积分</span>
                    {!canAfford && (
                      <span className="text-xs text-s-text-secondary ml-1">
                        (还差 {deficit} 积分)
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="rounded-lg bg-s-success/20 px-3 py-2 text-xs font-medium text-s-success"
                      >
                        已提交!
                      </motion.div>
                    ) : confirmId === reward.id ? (
                      <motion.div
                        key="confirm"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex gap-1.5"
                      >
                        <Button
                          size="sm"
                          variant="neon-orange"
                          onClick={() => handleExchange(reward.id)}
                        >
                          确定
                        </Button>
                        <Button
                          size="sm"
                          variant="neon"
                          onClick={() => setConfirmId(null)}
                        >
                          取消
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="idle">
                        <Button
                          size="sm"
                          variant="neon-orange"
                          disabled={!canAfford}
                          onClick={() => setConfirmId(reward.id)}
                        >
                          兑换
                          <ArrowRight size={14} className="ml-1" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}

        {activeRewards.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-s-text-secondary">暂无奖励</p>
            <p className="text-xs text-s-text-secondary mt-1">等待家长配置奖励</p>
          </div>
        )}
      </div>
    </div>
  );
}
