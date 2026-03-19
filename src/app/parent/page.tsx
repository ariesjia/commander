"use client";

import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMode } from "@/contexts/ModeContext";
import { useRouter } from "next/navigation";
import { DashboardStats } from "@/components/parent/DashboardStats";
import { Bot, ChevronRight } from "lucide-react";
import { toDisplay } from "@/lib/score-display";

export default function ParentDashboard() {
  const { student, mechaName, mechaLevelName, pendingExchanges, weeklyCompletedCount, weeklyTotalCount, getTasksWithStatus, baseScore, isLoading } = useData();
  const { user } = useAuth();
  const { switchToStudent, setTransitioning } = useMode();
  const router = useRouter();

  const pendingTasks = getTasksWithStatus().filter((t) => t.status === "pending").length;
  const pendingCount = pendingExchanges.length + pendingTasks;
  const mechaDisplay = isLoading
    ? "加载中..."
    : mechaName && mechaLevelName
      ? `${mechaName} · ${mechaLevelName}`
      : mechaName ?? "未领养机甲";

  const handleSwitch = async () => {
    try {
      await switchToStudent();
      setTransitioning(true);
      await new Promise((r) => setTimeout(r, 800));
      router.push("/student");
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-p-text">
            你好，{user?.childNickname ?? "家长"}的家长
          </h1>
          <p className="text-sm text-p-text-secondary mt-1">
            今天也要加油哦
          </p>
        </div>
      </div>

      {/* Stats */}
      <DashboardStats
        balance={toDisplay(student.balance, baseScore)}
        weeklyCompleted={weeklyCompletedCount}
        weeklyTotal={weeklyTotalCount}
        pendingCount={pendingCount}
        streakDays={student.streakDays}
      />

      {/* Mecha overview card */}
      <button
        onClick={() => router.push("/parent/mecha")}
        className="w-full rounded-xl border border-p-border bg-p-card p-5 text-left transition-shadow hover:shadow-sm cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-p-text-secondary">机甲状态</h2>
            <p className="text-lg font-bold text-p-text mt-1">
              {mechaDisplay}
            </p>
            <p className="text-sm text-p-text-secondary mt-0.5">
              累计积分 {toDisplay(student.totalPoints, baseScore)}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
            <Bot size={32} className="text-p-accent" />
          </div>
        </div>
      </button>

      {/* Switch to student mode CTA */}
      <button
        onClick={handleSwitch}
        className="group flex items-center justify-between rounded-xl border border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 transition-all hover:shadow-md cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm">
            <Bot size={24} className="text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-p-text">切换到学生模式</p>
            <p className="text-sm text-p-text-secondary">
              把设备交给{user?.childNickname ?? "孩子"}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="text-p-text-secondary group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/parent/mecha")}
          className="rounded-xl border border-p-border bg-p-card p-4 text-left transition-shadow hover:shadow-sm cursor-pointer"
        >
          <p className="font-medium text-p-text">机甲查看</p>
          <p className="text-xs text-p-text-secondary mt-1">查看机甲及积分进度</p>
        </button>
        <button
          onClick={() => router.push("/parent/tasks")}
          className="rounded-xl border border-p-border bg-p-card p-4 text-left transition-shadow hover:shadow-sm cursor-pointer"
        >
          <p className="font-medium text-p-text">任务管理</p>
          <p className="text-xs text-p-text-secondary mt-1">创建和确认任务</p>
        </button>
        <button
          onClick={() => router.push("/parent/rewards")}
          className="rounded-xl border border-p-border bg-p-card p-4 text-left transition-shadow hover:shadow-sm cursor-pointer"
        >
          <p className="font-medium text-p-text">奖励管理</p>
          <p className="text-xs text-p-text-secondary mt-1">
            {pendingExchanges.length > 0
              ? `${pendingExchanges.length}个兑换待审核`
              : "管理奖励项目"}
          </p>
        </button>
      </div>
    </div>
  );
}
