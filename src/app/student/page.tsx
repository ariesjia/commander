"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMode } from "@/contexts/ModeContext";
import { MechaViewer } from "@/components/mecha/MechaViewer";
import { XuanjiaViewer } from "@/components/mecha/XuanjiaViewer";
import { AdoptionFlow } from "@/components/mecha/AdoptionFlow";
import { MechaProgress } from "@/components/mecha/MechaProgress";
import { XuanjiaProgress } from "@/components/mecha/XuanjiaProgress";
import Link from "next/link";
import { PinDialog } from "@/components/mode-switch/PinDialog";
import Image from "next/image";
import { Coins, Flame, Snowflake, Lock, Library, Swords, Package } from "lucide-react";
import { MECHA_STAGES, STREAK_EFFECTS } from "@/lib/mecha-config";
import { toDisplay } from "@/lib/score-display";

import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";

export default function StudentHome() {
  const { student, mechaStage, adoptedMechaIds, adoptedMechas, mechaPointsBySlug, showPinyin, isLoading, refetch, baseScore } = useData();
  const hasMechas = adoptedMechas.length > 0;
  const { user } = useAuth();
  const { switchToParent, setTransitioning } = useMode();
  const router = useRouter();
  const [pinOpen, setPinOpen] = useState(false);

  const primarySlug = adoptedMechaIds[0] ?? null;
  const primaryMechaPoints = primarySlug ? (mechaPointsBySlug[primarySlug] ?? 0) : 0;
  const { data: primaryMecha } = useMecha(primarySlug);
  const levelInfo = getLevelFromMecha(primaryMecha, primaryMechaPoints);

  const stageName = MECHA_STAGES[mechaStage]?.name ?? "未启动";
  const displayTitle = primaryMecha
    ? `${primaryMecha.name} · ${levelInfo?.name ?? ""}`
    : stageName;
  const streakEffect = STREAK_EFFECTS.filter((e) => student.streakDays >= e.days).pop();

  const handlePinSuccess = () => {
    setPinOpen(false);
    setTransitioning(true);
    setTimeout(() => {
      router.push("/parent");
      setTransitioning(false);
    }, 800);
  };
  const verifyPin = async (pin: string) => switchToParent(pin);

  // 加载中：logo 固定顶部，loading 居中
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[70vh]">
        <div className="relative flex justify-center pt-4 w-full shrink-0">
          <Image src="/logo.svg" alt="" width={40} height={40} className="opacity-90" />
          <button
            onClick={() => setPinOpen(true)}
            className="absolute right-0 top-4 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-s-text-secondary/30 hover:text-s-text-secondary/60 hover:bg-white/5 transition-all cursor-pointer touch-manipulation"
            aria-label="切回家长模式"
          >
            <Lock size={20} />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
          <p className="text-sm text-s-text-secondary">加载中...</p>
        </div>
        <PinDialog open={pinOpen} onClose={() => setPinOpen(false)} onSuccess={handlePinSuccess} verifyPin={verifyPin} />
      </div>
    );
  }

  // 未领养：显示领养流程
  if (adoptedMechaIds.length === 0) {
    return (
      <div className="flex flex-col min-h-[70vh]">
        <div className="relative flex justify-center pt-4">
          <Image src="/logo.svg" alt="" width={40} height={40} className="opacity-90" />
          <button
            onClick={() => setPinOpen(true)}
            className="absolute right-0 top-4 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-s-text-secondary/30 hover:text-s-text-secondary/60 hover:bg-white/5 transition-all cursor-pointer touch-manipulation"
            aria-label="切回家长模式"
          >
            <Lock size={20} />
          </button>
        </div>
        <div className="mt-10 md:mt-14">
          <AdoptionFlow onComplete={refetch} />
        </div>
        <PinDialog open={pinOpen} onClose={() => setPinOpen(false)} onSuccess={handlePinSuccess} verifyPin={verifyPin} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-2 pb-6">
      {/* 顶栏：居中信息与锁，避免左右绝对定位抢空间 */}
      <div className="relative flex flex-col items-center text-center px-11">
        <Image src="/logo.svg" alt="" width={40} height={40} className="mb-2 opacity-90" />
        <p className="font-display text-sm text-s-primary neon-text tracking-wider">
          MotiMech · {user?.childNickname ?? "---"}
        </p>
        <h1 className="font-display text-lg font-bold text-s-text mt-1">{displayTitle}</h1>
        {levelInfo?.description && (
          <p className="text-sm text-s-text-secondary mt-1 max-w-md">{levelInfo.description}</p>
        )}

        <button
          type="button"
          onClick={() => setPinOpen(true)}
          className="absolute right-0 top-0 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-s-text-secondary/30 hover:text-s-text-secondary/60 hover:bg-white/5 transition-all cursor-pointer touch-manipulation"
          aria-label="切回家长模式"
        >
          <Lock size={20} />
        </button>

        {/* Mecha display */}
        <div className="relative flex justify-center">
          {primarySlug ? (
            <XuanjiaViewer
              slug={primarySlug}
              mechaPoints={primaryMechaPoints}
              className="w-64 h-80 sm:w-72 sm:h-96"
            />
          ) : (
            <MechaViewer stage={mechaStage} className="w-64 h-80 sm:w-72 sm:h-96" />
          )}
          {streakEffect && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-400 border border-orange-500/30">
                <Flame size={12} />
                {streakEffect.name} · {student.streakDays}天
              </span>
            </div>
          )}
        </div>
      </div>


      {/* Points bar */}
      <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-white/5 bg-black/15 px-4 py-3">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-s-accent" />
          <div>
            <p className="text-xs text-s-text-secondary">可用积分</p>
            <p className="font-display text-xl font-bold text-s-text">{toDisplay(student.balance, baseScore)}</p>
          </div>
        </div>
        {student.frozenPoints > 0 && (
          <div className="flex items-center gap-2">
            <Snowflake size={16} className="text-blue-400" />
            <div>
              <p className="text-xs text-s-text-secondary">冻结</p>
              <p className="text-sm font-bold text-blue-400">{toDisplay(student.frozenPoints, baseScore)}</p>
            </div>
          </div>
        )}
        <div>
          <p className="text-xs text-s-text-secondary">累计</p>
          <p className="text-sm font-semibold text-s-text-secondary">{toDisplay(student.totalPoints, baseScore)}</p>
        </div>
      </div>

      {/* Progress */}
      {primarySlug ? (
        <XuanjiaProgress slug={primarySlug} mechaPoints={primaryMechaPoints} baseScore={baseScore} />
      ) : (
        <MechaProgress totalPoints={student.totalPoints} stage={mechaStage} baseScore={baseScore} />
      )}

      {/* 快捷入口：放在机体与数据之后，拇指区更易点到；与底部 Tab 互补 */}
      {hasMechas && (
        <section className="glass-card rounded-2xl p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-s-primary/55">
            快捷入口
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/student/mecha"
              className="group flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border border-cyan-400/20 bg-gradient-to-b from-cyan-500/10 to-transparent px-3 py-2.5 text-center transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/15 touch-manipulation active:scale-[0.99]"
            >
              <Library size={20} className="text-cyan-300/90" strokeWidth={1.75} />
              <span className="text-xs font-semibold text-cyan-100/95">机甲库</span>
              <span className="text-[10px] leading-tight text-cyan-200/50">机体与进化</span>
            </Link>
            <Link
              href="/student/items"
              className="group flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/10 to-transparent px-3 py-2.5 text-center transition-colors hover:border-fuchsia-400/35 hover:bg-fuchsia-500/12 touch-manipulation active:scale-[0.99]"
            >
              <Package size={20} className="text-fuchsia-300/90" strokeWidth={1.75} />
              <span className="text-xs font-semibold text-fuchsia-100/95">道具库</span>
              <span className="text-[10px] leading-tight text-fuchsia-200/50">背包与材料</span>
            </Link>
          </div>
          <Link
            href="/student/battle"
            className="mt-2 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-4 py-3 text-sm font-semibold text-amber-100/95 shadow-[0_0_20px_rgba(245,158,11,0.12)] transition-colors hover:border-amber-400/55 hover:bg-amber-500/20 touch-manipulation active:scale-[0.99]"
          >
            <Swords size={18} strokeWidth={2} />
            每日战斗
          </Link>
        </section>
      )}

      <PinDialog
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={handlePinSuccess}
        verifyPin={verifyPin}
      />
    </div>
  );
}
