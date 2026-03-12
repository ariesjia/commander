"use client";

import { useId, useState, useEffect, useCallback, useRef } from "react";

/**
 * 雪碧图动画组件
 * 支持水平排列的多帧图片，循环播放
 *
 * 雪碧图要求：
 * - 多帧图片水平拼接成一行（如 8 帧 = 8 张图横向排列）
 * - 每帧尺寸需一致
 * - 可通过 frameCount、frameHeight 调整
 */
interface SpriteAnimationProps {
  src: string;
  /** 总帧数 */
  frameCount?: number;
  /** 帧率（每秒帧数） */
  fps?: number;
  /** 每帧宽度（px），不传则等于 frameHeight */
  frameWidth?: number;
  /** 每帧高度（px） */
  frameHeight?: number;
  /** 布局：水平 / 垂直 */
  direction?: "horizontal" | "vertical";
  /** 是否循环播放，默认 true */
  loop?: boolean;
  /** 播放完成时回调（不循环时播放一次后触发，循环时每轮结束触发） */
  onComplete?: () => void;
  className?: string;
}

export function SpriteAnimation({
  src,
  frameCount = 8,
  fps = 12,
  frameWidth,
  frameHeight = 64,
  direction = "horizontal",
  loop = true,
  onComplete,
  className = "",
}: SpriteAnimationProps) {
  const id = useId().replace(/:/g, "");
  const w = frameWidth ?? frameHeight;
  const h = frameHeight;
  const duration = frameCount / fps;

  const isHorizontal = direction === "horizontal";
  const bgSize = isHorizontal
    ? `${frameCount * w}px ${h}px`
    : `${w}px ${frameCount * h}px`;

  // 必须用 frameCount*w 才能让 steps() 精确落在每帧边界，否则会插值到两帧之间导致模糊/错位
  const endX = isHorizontal ? frameCount * w : 0;
  const endY = isHorizontal ? 0 : frameCount * h;

  const [errored, setErrored] = useState(false);
  const [finished, setFinished] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // 不循环时，最后一帧位置（forwards 会停在 -frameCount*w 即空白，需手动切到最后一帧）
  const lastFrameX = isHorizontal ? (frameCount - 1) * w : 0;
  const lastFrameY = isHorizontal ? 0 : (frameCount - 1) * h;

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.animationName === `sprite-${id}`) {
        if (!loop) setFinished(true);
        onCompleteRef.current?.();
      }
    },
    [id, loop],
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => setErrored(false);
    img.onerror = () => setErrored(true);
    img.src = src;
  }, [src]);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 text-xs shrink-0 ${className}`}
        style={{ width: w, height: h }}
        title="雪碧图加载失败，请检查 box.jpg"
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden shrink-0 ${className}`}
      style={{ width: w, height: h }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes sprite-${id}{from{background-position:0 0}to{background-position:-${endX}px -${endY}px}}`,
        }}
      />
      <div
        className="h-full w-full"
        style={
          finished
            ? {
                backgroundImage: `url(${src})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: bgSize,
                backgroundPosition: `-${lastFrameX}px -${lastFrameY}px`,
              }
            : {
                backgroundImage: `url(${src})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: bgSize,
                backgroundPosition: "0 0",
                animation: `sprite-${id} ${duration}s steps(${frameCount}) ${loop ? "infinite" : "forwards"}`,
              }
        }
        onAnimationEnd={finished ? undefined : handleAnimationEnd}
      />
    </div>
  );
}
