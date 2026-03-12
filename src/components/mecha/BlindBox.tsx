"use client";

/**
 * 盲盒：显示雪碧图的第一帧
 */
interface BlindBoxProps {
  src: string;
  frameCount?: number;
  frameHeight?: number;
  frameWidth?: number;
  className?: string;
}

export function BlindBox({
  src,
  frameCount = 8,
  frameHeight = 120,
  frameWidth,
  className = "",
}: BlindBoxProps) {
  const w = frameWidth ?? frameHeight;
  const h = frameHeight;
  const bgSize = `${frameCount * w}px ${h}px`;

  return (
    <div
      className={`overflow-hidden shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${className}`}
      style={{ width: w, height: h }}
    >
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: bgSize,
          backgroundPosition: "0 0",
        }}
      />
    </div>
  );
}
