"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, usePresence } from "framer-motion";
import { Play, X } from "lucide-react";

export interface MechaEvolutionVideoModalProps {
  videoUrl: string;
  /** 弹层标题，如机甲名 */
  title: string;
  onClose: () => void;
}

/**
 * 机甲进化/展示视频：白底卡 + 深色遮罩，适配白底 MP4 素材。
 * z-[76]：高于进化历程 Modal (75)，低于大图预览 (80)。
 * 需作为 AnimatePresence 的直接子节点以配合 usePresence 退场。
 */
export function MechaEvolutionVideoModal({ videoUrl, title, onClose }: MechaEvolutionVideoModalProps) {
  const titleId = useId();
  const [isPresent, safeToRemove] = usePresence();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** 自动播放失败或播放结束后显示大播放按钮 */
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  const stopAndResetVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }, []);

  const handleClose = useCallback(() => {
    stopAndResetVideo();
    onClose();
  }, [onClose, stopAndResetVideo]);

  useEffect(() => {
    if (!isPresent) {
      stopAndResetVideo();
      const timer = window.setTimeout(safeToRemove, 280);
      return () => window.clearTimeout(timer);
    }
  }, [isPresent, safeToRemove, stopAndResetVideo]);

  useEffect(() => {
    if (isPresent) closeBtnRef.current?.focus();
  }, [isPresent]);

  /** 打开弹层后尽量自动播放；失败或结束时显示大播放按钮 */
  useEffect(() => {
    if (!isPresent) return;
    const v = videoRef.current;
    if (!v) return;

    setShowPlayOverlay(false);

    const onPlaying = () => setShowPlayOverlay(false);
    const onEnded = () => setShowPlayOverlay(true);

    v.addEventListener("playing", onPlaying);
    v.addEventListener("ended", onEnded);

    v.muted = true;
    void v.play().catch(() => setShowPlayOverlay(true));

    return () => {
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("ended", onEnded);
    };
  }, [isPresent, videoUrl]);

  const handleBigPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    void v.play().catch(() => setShowPlayOverlay(true));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPresent) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, isPresent]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="theme-student">
      <motion.div
        role="presentation"
        className="fixed inset-0 z-[76] flex items-center justify-center p-3 sm:p-4 bg-black/75"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPresent ? 1 : 0 }}
        transition={{ duration: 0.22 }}
        aria-hidden
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-3xl rounded-2xl border border-slate-200/90 bg-slate-50 shadow-2xl shadow-black/25 ring-1 ring-cyan-400/15"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{
            scale: isPresent ? 1 : 0.96,
            opacity: isPresent ? 1 : 0,
          }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />

          <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 py-3 sm:px-5">
            <h2 id={titleId} className="text-base font-semibold text-slate-800 pr-2">
              {title}
              <span className="text-slate-500 font-normal"> · 进化影像</span>
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={handleClose}
              className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
              aria-label="关闭"
            >
              <X size={22} />
            </button>
          </div>

          <div className="p-3 sm:p-5">
            {/** 素材 726×520，固定比例占位；未加载/未播放时也有高度 */}
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80">
              <div className="relative mx-auto w-full max-w-[726px] aspect-[726/520] bg-white">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  className="absolute inset-0 h-full w-full object-contain bg-white"
                  aria-label={`${title} 进化影像`}
                />
                {showPlayOverlay ? (
                  <button
                    type="button"
                    className="absolute inset-0 z-10 flex items-center justify-center bg-white/0 hover:bg-white/40 transition-colors touch-manipulation"
                    onClick={handleBigPlay}
                    aria-label="播放进化影像"
                  >
                    <span className="rounded-full bg-white/95 p-5 sm:p-8 shadow-xl shadow-slate-400/25 ring-2 ring-cyan-400/35">
                      <Play
                        className="h-16 w-16 sm:h-24 sm:w-24 text-slate-800"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  );
}
