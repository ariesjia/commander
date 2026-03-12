"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BlindBox } from "./BlindBox";
import { SpriteAnimation } from "@/components/ui/SpriteAnimation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
}

export function AdoptionFlow({ onComplete }: AdoptionFlowProps) {
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
      const res = await api.post<{
        ok: boolean;
        mechaId: string;
        name: string;
        imageUrl: string;
        levelName: string | null;
      }>("/api/student/adopt");
      setAdoptedInfo({
        name: res.name,
        imageUrl: res.imageUrl,
        levelName: res.levelName,
      });
      setPhase("reveal");
    } catch (e) {
      const msg = typeof e === "object" && e && "message" in e ? String((e as Error).message) : "领取失败，请重试";
      toast(msg, "error");
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

  const revealInfo = adoptedInfo ?? {
    name: "机甲",
    imageUrl: "/mecha/xuanjia/level-0.png",
    levelName: null,
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 min-h-[60vh]">
      <AnimatePresence mode="wait">
        {phase === "blind" && (
          <motion.div
            key="blind"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-s-text-secondary text-lg text-center">
              点击盲盒，随机抽取你的机甲
            </p>
            <button onClick={handleBlindClick} className="focus:outline-none">
              <BlindBox
                src="/box.png"
                frameCount={8}
                frameHeight={300}
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
              frameHeight={300}
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
                  <div className="flex items-center justify-center bg-s-card/50 text-s-text-secondary w-64 h-80">
                    <span>{revealInfo.name}</span>
                  </div>
                ) : (
                  <img
                    src={revealInfo.imageUrl}
                    alt={revealInfo.name}
                    className="object-contain bg-s-card/50 w-64 h-80"
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
              {revealInfo.levelName && (
                <p className="text-s-text-secondary text-sm mt-1">{revealInfo.levelName}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="领取机甲"
        message="确定要打开盲盒，随机抽取你的机甲吗？"
        confirmLabel="确认领取"
        cancelLabel="再想想"
        variant="default"
        loading={false}
      />
    </div>
  );
}
