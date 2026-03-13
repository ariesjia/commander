"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, usePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";

interface ImagePreviewModalProps {
  imageUrl: string;
  caption: string;
  showPinyin?: boolean;
  onClose: () => void;
}

function getDistance(t1: Touch, t2: Touch) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

/** 学生端通用大图预览：保证图和文字在屏幕内，支持手指缩放 */
export function ImagePreviewModal({
  imageUrl,
  caption,
  showPinyin = false,
  onClose,
}: ImagePreviewModalProps) {
  const [isPresent, safeToRemove] = usePresence();
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const lastPinchRef = useRef<number | null>(null);
  const initialScaleRef = useRef(1);
  const scaleRef = useRef(1);
  scaleRef.current = scale;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchRef.current = getDistance(e.touches[0]!, e.touches[1]!);
      initialScaleRef.current = scaleRef.current;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchRef.current !== null) {
      e.preventDefault();
      const dist = getDistance(e.touches[0]!, e.touches[1]!);
      const deltaScale = dist / lastPinchRef.current;
      const newScale = Math.min(4, Math.max(0.5, initialScaleRef.current * deltaScale));
      setScale(newScale);
      lastPinchRef.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchRef.current = null;
  }, []);

  const handleDoubleClick = useCallback(() => {
    setScale((s) => (s > 1 ? 1 : 2));
    setPos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!isPresent) {
      const timer = setTimeout(safeToRemove, 300);
      return () => clearTimeout(timer);
    }
  }, [isPresent, safeToRemove]);

  const content = (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 theme-student"
      initial={{ opacity: 0 }}
      animate={{ opacity: isPresent ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 pb-2 overflow-hidden">
        <div
          className="flex-1 min-h-0 w-full flex flex-col items-center justify-center overflow-hidden"
          style={{ touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex flex-col items-center justify-center"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={imageUrl}
              alt={caption}
              className="max-w-[90vw] max-h-[60vh] w-auto h-auto object-contain rounded-lg select-none"
              onError={(e) => (e.currentTarget.style.display = "none")}
              onDoubleClick={handleDoubleClick}
              draggable={false}
            />
            <p className="mt-3 text-center text-sm text-s-text-secondary px-4">
              <TextWithPinyin text={caption} showPinyin={showPinyin} />
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex justify-center">
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 px-5 py-2.5 text-sm text-s-text hover:bg-white/20"
        >
          关闭
        </button>
      </div>
    </motion.div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
}
