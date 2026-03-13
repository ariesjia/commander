"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const PULL_THRESHOLD = 80;
const RESISTANCE = 0.4;

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, disabled, className }: PullToRefreshProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const handleRefresh = useCallback(async () => {
    if (disabled || isRefreshing) return;
    setIsRefreshing(true);
    setPullY(0);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, disabled, isRefreshing]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      startY.current = e.touches[0].clientY;
    },
    [disabled, isRefreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (pullY >= PULL_THRESHOLD && !isRefreshing && !disabled) {
      handleRefresh();
    } else {
      setPullY(0);
    }
  }, [pullY, isRefreshing, disabled, handleRefresh]);

  // 使用 passive: false 以便在顶部下拉时 preventDefault，阻止浏览器默认刷新
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (disabled || isRefreshing) return;
      const scrollTop = el.scrollTop;
      if (scrollTop > 0) return;

      const deltaY = e.touches[0].clientY - startY.current;
      if (deltaY > 0) {
        e.preventDefault();
        const resisted = Math.min(deltaY * RESISTANCE, PULL_THRESHOLD * 1.5);
        setPullY(resisted);
      } else {
        setPullY(0);
      }
    };

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, [disabled, isRefreshing]);

  const showIndicator = pullY > 0 || isRefreshing;

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto overscroll-contain ${className ?? ""}`}
      style={{ overscrollBehaviorY: "contain" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 下拉刷新指示器 */}
      <div
        className="flex justify-center items-center transition-all duration-200 ease-out overflow-hidden"
        style={{
          height: showIndicator ? 56 : 0,
          opacity: showIndicator ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className={`h-6 w-6 rounded-full border-2 border-s-primary border-t-transparent ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
          <span className="text-xs text-s-text-secondary">
            {isRefreshing ? "刷新中..." : pullY >= PULL_THRESHOLD ? "松开刷新" : "下拉刷新"}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
