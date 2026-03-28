"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export type StudentPageHeaderProps = {
  title: string;
  subtitle?: string;
  /** 默认 `router.back()`；传入如 `/student` 则回学生首页 */
  backHref?: string;
  className?: string;
};

/**
 * 学生子页统一顶栏：左侧返回、居中标题（可选副标题）。
 * 与机甲库 / 道具库等页面视觉一致。
 */
export function StudentPageHeader({ title, subtitle, backHref, className }: StudentPageHeaderProps) {
  const router = useRouter();

  const backClassName =
    "absolute left-0 flex h-9 w-9 items-center justify-center rounded-lg text-s-text-secondary transition-colors hover:bg-white/10 hover:text-s-text touch-manipulation";

  const backControl = backHref ? (
    <Link href={backHref} className={backClassName} aria-label="返回">
      <BackIcon />
    </Link>
  ) : (
    <button type="button" onClick={() => router.back()} className={backClassName} aria-label="返回">
      <BackIcon />
    </button>
  );

  return (
    <div className={cn("relative flex min-h-[44px] items-center justify-center", className)}>
      {backControl}
      {subtitle ? (
        <div className="max-w-[min(100%,18rem)] px-11 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-s-primary/60">{subtitle}</p>
          <h1 className="mt-0.5 font-display text-lg font-semibold text-s-text">{title}</h1>
        </div>
      ) : (
        <h1 className="px-11 text-center font-display text-lg font-semibold leading-tight text-s-text">{title}</h1>
      )}
    </div>
  );
}
