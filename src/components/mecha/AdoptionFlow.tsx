"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BlindBox } from "./BlindBox";
import { SpriteAnimation } from "@/components/ui/SpriteAnimation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getXuanjiaLevelInfo, MECHA_SECOND_INFO } from "@/lib/mecha-adoption";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

type Phase = "blind" | "confirm" | "opening" | "reveal" | "done";

interface AdoptedMechaInfo {
  name: string;
  imageUrl: string;
  levelName: string | null;
}

interface AdoptionFlowProps {
  onComplete: () => void;
  totalPoints: number;
  /** 0=第一只(玄甲), 1=第二只 */
  mechaIndex?: number;
  /** 紧凑模式，用于第二只领取 */
  compact?: boolean;
}

export function AdoptionFlow({ onComplete, totalPoints, mechaIndex = 0, compact = false }: AdoptionFlowProps) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("blind");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [adoptedInfo, setAdoptedInfo] = useState<AdoptedMechaInfo | null>(null);
  const prevPhase = useRef<Phase>("blind");

  useEffect(() => {
    if (phase === "reveal" && prevPhase.current !== "reveal") setImgError(false);
    prevPhase.current = phase;
  }, [phase]);

  const handleBlindClick = () => setConfirmOpen(true);

  const handleConfirm = () => {
    setConfirmOpen(false);
    setPhase("opening");
  };

  const handleOpenComplete = async () => {
    setAdopting(true);
    try {
      const res = await api.post<{ ok: boolean; mechaId: string; name: string; imageUrl: string; levelName: string | null }>("/api/student/adopt");
      setAdoptedInfo({ name: res.name, imageUrl: res.imageUrl, levelName: res.levelName });
      setPhase("reveal");
    } catch (e) {
      toast(typeof e === "object" && e && "message" in e ? String((e as Error).message) : "领取失败，请重试");
      setPhase("blind");
    } finally {
      setAdopting(false);
    }
  };

  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  const levelInfo = getXuanjiaLevelInfo(totalPoints);
  const isSecond = mechaIndex === 1;
  const revealInfo = adoptedInfo ?? (isSecond ? { name: MECHA_SECOND_INFO.name, imageUrl: MECHA_SECOND_INFO.imageUrl, levelName: null } : { name: "玄甲", imageUrl: levelInfo.imageUrl, levelName: levelInfo.name });

  return (
    <div className={`flex flex-col items-center justify-center px-4 ${compact ? "gap-4" : "min-h-[60vh]"}`}>
      <AnimatePresence mode="wait">
        {phase === "blind" && (
          <motion.div
            key="blind"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex flex-col items-center ${compact ? "gap-3" : "gap-6"}`}
          >
            <p className="text-s-text-secondary text-sm text-center">
              {isSecond ? "点击盲盒，领取你的第二台机甲" : "点击盲盒，领取你的第一台机甲"}
            </p>
            <button onClick={handleBlindClick} className="focus:outline-none">
              <BlindBox
                src="/box.png"
                frameCount={8}
                frameHeight={compact ? 120 : 160}
                className="rounded-xl shadow-lg ring-2 ring-s-primary/30"
              />
            </button>
          </motion.div>
        )}

        {phase === "opening" && (
          <motion.div
            key="opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-s-primary text-sm font-medium">正在开启...</p>
            <SpriteAnimation
              src="/box.png"
              frameCount={8}
              fps={8}
              frameHeight={compact ? 150 : 200}
              loop={false}
              onComplete={handleOpenComplete}
              className="rounded-xl"
            />
          </motion.div>
        )}

        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              initial={{ opacity: 0, filter: "brightness(0)" }}
              animate={{
                opacity: 1,
                filter: "brightness(1)",
                transition: { duration: 0.6, delay: 0.2 },
              }}
              className="relative"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{
                  scale: 1,
                  transition: { type: "spring", stiffness: 150, delay: 0.3 },
                }}
                className="rounded-xl overflow-hidden ring-4 ring-s-primary/50 shadow-[0_0_40px_rgba(0,212,255,0.3)]"
              >
                {imgError ? (
                  <div className={`flex items-center justify-center bg-s-card/50 text-s-text-secondary ${compact ? "w-48 h-60" : "w-64 h-80"}`}>
                    <span>{revealInfo.name}</span>
                  </div>
                ) : (
                  <img
                    src={revealInfo.imageUrl}
                    alt={revealInfo.name}
                    className={`object-contain bg-s-card/50 ${compact ? "w-48 h-60" : "w-64 h-80"}`}
                    onError={() => setImgError(true)}
                  />
                )}
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
              className="text-center"
            >
              <p className="text-s-primary font-display text-xl font-bold">{revealInfo.name}</p>
              {revealInfo.levelName && <p className="text-s-text-secondary text-sm mt-1">{revealInfo.levelName}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="领取机甲"
        message={isSecond ? "确定要打开盲盒，领取你的第二台机甲吗？" : "确定要打开盲盒，领取你的第一台机甲吗？"}
        confirmLabel="确认领取"
        cancelLabel="再想想"
        variant="default"
        loading={false}
      />
    </div>
  );
}
