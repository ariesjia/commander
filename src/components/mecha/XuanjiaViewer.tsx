"use client";

import { useState } from "react";
import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";

interface XuanjiaViewerProps {
  slug: string;
  mechaPoints: number;
  className?: string;
}

export function XuanjiaViewer({ slug, mechaPoints, className = "" }: XuanjiaViewerProps) {
  const { data: mecha } = useMecha(slug);
  const levelInfo = getLevelFromMecha(mecha, mechaPoints);
  const [imgError, setImgError] = useState(false);

  if (!levelInfo) {
    return (
      <div
        className={`flex items-center justify-center bg-s-card/30 rounded-xl text-s-text-secondary ${className}`}
      >
        <span className="text-sm">加载中...</span>
      </div>
    );
  }

  if (imgError) {
    return (
      <div
        className={`flex items-center justify-center bg-s-card/30 rounded-xl text-s-text-secondary ${className}`}
      >
        <span className="text-sm">{mecha?.name ?? "机甲"} · {levelInfo.name}</span>
      </div>
    );
  }

  return (
    <img
      src={levelInfo.imageUrl}
      alt={`${mecha?.name ?? "机甲"} ${levelInfo.name}`}
      className={`object-contain ${className}`}
      onError={() => setImgError(true)}
    />
  );
}
