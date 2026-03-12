"use client";

import { useState } from "react";
import { getXuanjiaLevelInfo } from "@/lib/mecha-adoption";
import { BlindBox } from "./BlindBox";

interface XuanjiaViewerProps {
  totalPoints: number;
  className?: string;
}

export function XuanjiaViewer({ totalPoints, className = "" }: XuanjiaViewerProps) {
  const levelInfo = getXuanjiaLevelInfo(totalPoints);
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    // 图片未就绪时，level 0 用盲盒第一帧作为占位
    if (levelInfo.level === 0) {
      return (
        <div className={`flex justify-center items-center ${className}`}>
          <BlindBox src="/box.png" frameCount={8} frameHeight={200} className="rounded-xl" />
        </div>
      );
    }
    return (
      <div
        className={`flex items-center justify-center bg-s-card/30 rounded-xl text-s-text-secondary ${className}`}
      >
        <span className="text-sm">玄甲 · {levelInfo.name}</span>
      </div>
    );
  }

  return (
    <img
      src={levelInfo.imageUrl}
      alt={`玄甲 ${levelInfo.name}`}
      className={`object-contain ${className}`}
      onError={() => setImgError(true)}
    />
  );
}
