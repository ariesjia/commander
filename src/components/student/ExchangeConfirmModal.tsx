"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { Coins, X } from "lucide-react";

interface ExchangeConfirmModalProps {
  open: boolean;
  reward: { id: string; name: string; description?: string; imageUrl?: string; points: number } | null;
  showPinyin?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 学生端兑换确认弹窗：带注音、loading 状态 */
export function ExchangeConfirmModal({
  open,
  reward,
  showPinyin = false,
  loading = false,
  onConfirm,
  onCancel,
}: ExchangeConfirmModalProps) {
  if (!reward) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 theme-student"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-2xl bg-[#0c1222] border border-s-primary/20 p-5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onCancel}
              disabled={loading}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-s-text-secondary hover:bg-white/10 disabled:opacity-50"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col gap-4 pt-2">
              <p className="text-sm text-s-text-secondary">
                <TextWithPinyin text="确定要用积分兑换以下奖励吗？" showPinyin={showPinyin} />
              </p>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
                {reward.imageUrl ? (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="h-14 w-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-s-accent/20 shrink-0">
                    <Coins size={24} className="text-s-accent" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-s-text">
                    <TextWithPinyin text={reward.name} showPinyin={showPinyin} />
                  </p>
                  {reward.description && (
                    <p className="text-sm text-s-text-secondary mt-0.5">
                      <TextWithPinyin text={reward.description} showPinyin={showPinyin} />
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Coins size={14} className="text-s-accent" />
                    <span className="text-sm font-bold text-s-accent">{reward.points} 积分</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  variant="neon-orange"
                  onClick={onConfirm}
                  className="flex-1"
                  loading={loading}
                >
                  确定兑换
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
