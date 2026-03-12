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
import { MechaLibrary } from "@/components/mecha/MechaLibrary";
import { PinDialog } from "@/components/mode-switch/PinDialog";
import Image from "next/image";
import { Coins, Flame, Snowflake, Lock } from "lucide-react";
import { MECHA_STAGES, STREAK_EFFECTS } from "@/lib/mecha-config";
import { MECHA_XUANJIA, getXuanjiaLevelInfo, canAdoptSecond } from "@/lib/mecha-adoption";

export default function StudentHome() {
  const { student, mechaStage, adoptedMechaIds, refetch } = useData();
  const { user } = useAuth();
  const { switchToParent, setTransitioning } = useMode();
  const router = useRouter();
  const [pinOpen, setPinOpen] = useState(false);
  const [showSecondAdoption, setShowSecondAdoption] = useState(false);

  const stageName = MECHA_STAGES[mechaStage]?.name ?? "未启动";
  const xuanjiaLevelInfo = adoptedMechaIds.includes(MECHA_XUANJIA) ? getXuanjiaLevelInfo(student.totalPoints) : null;
  const xuanjiaLevel = xuanjiaLevelInfo?.level ?? 0;
  const canAdopt2nd = canAdoptSecond(adoptedMechaIds, xuanjiaLevel);
  const streakEffect = STREAK_EFFECTS.filter((e) => student.streakDays >= e.days).pop();

  const handlePinSuccess = () => {
    setPinOpen(false);
    setTransitioning(true);
    setTimeout(() => {
      router.push("/parent");
      setTransitioning(false);
    }, 400);
  };
  const verifyPin = async (pin: string) => switchToParent(pin);

  // 未领养第一只：显示领养流程
  if (adoptedMechaIds.length === 0) {
    return (
      <div className="flex flex-col min-h-[70vh]">
        <div className="relative flex justify-center pt-4">
          <Image src="/logo.svg" alt="" width={40} height={40} className="opacity-90" />
          <button
            onClick={() => setPinOpen(true)}
            className="absolute right-0 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-s-text-secondary/30 hover:text-s-text-secondary/60 hover:bg-white/5 transition-all cursor-pointer"
            aria-label="切回家长模式"
          >
            <Lock size={14} />
          </button>
        </div>
        <AdoptionFlow onComplete={refetch} totalPoints={student.totalPoints} mechaIndex={0} />
        <PinDialog open={pinOpen} onClose={() => setPinOpen(false)} onSuccess={handlePinSuccess} verifyPin={verifyPin} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Header with lock button + 机甲库 */}
      <div className="relative flex flex-col items-center text-center">
        <div className="absolute left-0 top-0">
          {adoptedMechaIds.length > 0 && (
            <MechaLibrary adoptedMechaIds={adoptedMechaIds} totalPoints={student.totalPoints} />
          )}
        </div>
        <Image src="/logo.svg" alt="" width={40} height={40} className="mb-2 opacity-90" />
        <p className="font-display text-sm text-s-primary neon-text tracking-wider">
          指挥官 {user?.childNickname ?? "---"}
        </p>
        <h1 className="font-display text-lg font-bold text-s-text mt-1">
          {adoptedMechaIds.includes(MECHA_XUANJIA) ? `玄甲 · ${xuanjiaLevelInfo?.name ?? ""}` : stageName}
        </h1>

        {/* Switch back to parent — small, subtle */}
        <button
          onClick={() => setPinOpen(true)}
          className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-lg text-s-text-secondary/30 hover:text-s-text-secondary/60 hover:bg-white/5 transition-all cursor-pointer"
          aria-label="切回家长模式"
        >
          <Lock size={14} />
        </button>
      </div>

      {/* 可领取第二只时显示入口 */}
      {canAdopt2nd && !showSecondAdoption && (
        <button
          onClick={() => setShowSecondAdoption(true)}
          className="w-full rounded-xl border-2 border-dashed border-s-primary/50 bg-s-primary/10 py-4 text-s-primary font-medium transition-all hover:bg-s-primary/20"
        >
          玄甲已满级！点击领取第二只机甲
        </button>
      )}
      {canAdopt2nd && showSecondAdoption && (
        <AdoptionFlow
          onComplete={() => { refetch(); setShowSecondAdoption(false); }}
          totalPoints={student.totalPoints}
          mechaIndex={1}
          compact
        />
      )}

      {/* Mecha display */}
      <div className="relative flex justify-center">
        {adoptedMechaIds.includes(MECHA_XUANJIA) ? (
          <XuanjiaViewer totalPoints={student.totalPoints} className="w-64 h-80 sm:w-72 sm:h-96" />
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

      {/* Points bar */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-s-accent" />
          <div>
            <p className="text-xs text-s-text-secondary">可用积分</p>
            <p className="font-display text-xl font-bold text-s-text">
              {student.balance}
            </p>
          </div>
        </div>
        {student.frozenPoints > 0 && (
          <div className="flex items-center gap-2">
            <Snowflake size={16} className="text-blue-400" />
            <div>
              <p className="text-xs text-s-text-secondary">冻结</p>
              <p className="text-sm font-bold text-blue-400">{student.frozenPoints}</p>
            </div>
          </div>
        )}
        <div>
          <p className="text-xs text-s-text-secondary">累计</p>
          <p className="text-sm font-semibold text-s-text-secondary">{student.totalPoints}</p>
        </div>
      </div>

      {/* Progress */}
      {adoptedMechaIds.includes(MECHA_XUANJIA) ? (
        <XuanjiaProgress totalPoints={student.totalPoints} />
      ) : (
        <MechaProgress totalPoints={student.totalPoints} stage={mechaStage} />
      )}

      {/* PIN dialog */}
      <PinDialog
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={handlePinSuccess}
        verifyPin={verifyPin}
      />
    </div>
  );
}
