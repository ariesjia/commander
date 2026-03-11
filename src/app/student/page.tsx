"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMode } from "@/contexts/ModeContext";
import { MechaViewer } from "@/components/mecha/MechaViewer";
import { MechaProgress } from "@/components/mecha/MechaProgress";
import { PinDialog } from "@/components/mode-switch/PinDialog";
import { Coins, Flame, Snowflake, Lock } from "lucide-react";
import { MECHA_STAGES, STREAK_EFFECTS } from "@/lib/mecha-config";

export default function StudentHome() {
  const { student, mechaStage } = useData();
  const { user } = useAuth();
  const { switchToParent, setTransitioning } = useMode();
  const router = useRouter();
  const [pinOpen, setPinOpen] = useState(false);

  const stageName = MECHA_STAGES[mechaStage]?.name ?? "未启动";
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

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Header with lock button */}
      <div className="relative text-center">
        <p className="font-display text-sm text-s-primary neon-text tracking-wider">
          指挥官 {user?.childNickname ?? "---"}
        </p>
        <h1 className="font-display text-lg font-bold text-s-text mt-1">
          {stageName}
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

      {/* Mecha display */}
      <div className="relative flex justify-center">
        <MechaViewer stage={mechaStage} className="w-64 h-80 sm:w-72 sm:h-96" />
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
      <MechaProgress totalPoints={student.totalPoints} stage={mechaStage} />

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
