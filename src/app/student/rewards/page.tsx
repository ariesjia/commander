"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/Button";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { Coins, ShoppingCart, ArrowRight, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function StudentRewardsPage() {
  const { rewards, student, requestExchange, showPinyin, isLoading } = useData();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const activeRewards = rewards.filter((r) => r.isActive).sort((a, b) => a.points - b.points);


  const handleExchange = async (rewardId: string) => {
    const ok = await requestExchange(rewardId);
    if (ok) {
      setConfirmId(null);
      setSuccessId(rewardId);
      setTimeout(() => setSuccessId(null), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[40vh] items-center justify-center gap-4 pt-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
        <p className="text-sm text-s-text-secondary">加载中...</p>
      </div>
    );
  }

  const available = student.balance - student.frozenPoints;

  return (
    <div className="flex flex-col gap-4 pt-2 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl md:text-2xl font-bold text-s-text">
        奖励商城
        </h1>
        <div className="flex items-center gap-1.5 text-s-accent">
          <Coins size={20} className="md:w-6 md:h-6" />
          <span className="font-display text-base md:text-lg font-bold">{available}</span>
          <span className="text-sm md:text-base text-s-text-secondary">可用</span>
        </div>
      </div>

      {/* Link to exchanges */}
      <Link
        href="/student/exchanges"
        className="glass-card flex items-center justify-between p-4 md:p-5 cursor-pointer hover:border-s-primary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History size={20} className="text-s-primary md:w-6 md:h-6" />
          <span className="text-base md:text-lg text-s-text">我的兑换记录</span>
        </div>
        <ArrowRight size={18} className="text-s-text-secondary md:w-5 md:h-5" />
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
                "glass-card p-4 md:p-5 transition-all",
                !canAfford && "opacity-60",
              )}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {reward.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreviewImage({ url: reward.imageUrl!, name: reward.name })}
                    className="h-12 w-12 md:h-14 md:w-14 rounded-lg overflow-hidden shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-s-primary/50"
                  >
                    <img
                      src={reward.imageUrl}
                      alt={reward.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  <div
                    className={cn(
                      "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-lg shrink-0",
                      canAfford ? "bg-s-accent/20" : "bg-white/5",
                    )}
                  >
                    <ShoppingCart size={22} className={cn("md:w-7 md:h-7", canAfford ? "text-s-accent" : "text-s-text-secondary")} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base md:text-lg font-medium text-s-text">
                    <TextWithPinyin text={reward.name} showPinyin={showPinyin} />
                  </p>
                  {reward.description && (
                    <p className="text-sm md:text-base text-s-text-secondary mt-0.5">
                      <TextWithPinyin text={reward.description} showPinyin={showPinyin} />
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5 md:mt-2">
                    <Coins size={16} className="text-s-accent md:w-5 md:h-5" />
                    <span className="text-sm md:text-base font-bold text-s-accent">{reward.points} 积分</span>
                    {!canAfford && (
                      <span className="text-sm md:text-base text-s-text-secondary ml-1">
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
          <div className="glass-card p-8 md:p-10 text-center">
            <p className="text-base md:text-lg text-s-text-secondary">
              <TextWithPinyin text="暂无奖励" showPinyin={showPinyin} />
            </p>
            <p className="text-sm md:text-base text-s-text-secondary mt-1">
              <TextWithPinyin text="等待家长配置奖励" showPinyin={showPinyin} />
            </p>
          </div>
        )}
      </div>

      {/* 图片预览大图 */}
      <AnimatePresence>
        {previewImage && (
          <ImagePreviewModal
            key="preview"
            imageUrl={previewImage.url}
            caption={previewImage.name}
            showPinyin={showPinyin}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
