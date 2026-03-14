"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BarChart3, TrendingUp, TrendingDown, Wallet, ListChecks, ChevronLeft, ChevronRight } from "lucide-react";

interface PointsReport {
  period: "week" | "month";
  dateStr: string;
  start: string;
  end: string;
  taskEarned: number;
  exchangeCost: number;
  exchangeRefund: number;
  startBalance: number;
  endBalance: number;
}

interface TaskReport {
  period: "week" | "month";
  dateStr: string;
  totalCompleted: number;
  dailyCompleted: number;
  weeklyCompleted: number;
  ruleCompleted: number;
  pointsAwarded: number;
  dailyTaskCount: number;
  weeklyTaskCount: number;
  ruleTaskCount: number;
  dailyRate: number;
  weeklyRate: number;
}

function formatPeriodLabel(period: "week" | "month", dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (period === "week") {
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;
  }
  return `${y}年${m}月`;
}

function addPeriod(period: "week" | "month", dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (period === "week") {
    date.setDate(date.getDate() + delta * 7);
  } else {
    date.setMonth(date.getMonth() + delta);
  }
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

export default function ParentReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [dateStr, setDateStr] = useState(today);
  const [pointsReport, setPointsReport] = useState<PointsReport | null>(null);
  const [taskReport, setTaskReport] = useState<TaskReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = `period=${period}&date=${dateStr}`;
    Promise.all([
      api.get<PointsReport>(`/api/parent/reports/points?${params}`),
      api.get<TaskReport>(`/api/parent/reports/tasks?${params}`),
    ])
      .then(([points, tasks]) => {
        if (!cancelled) {
          setPointsReport(points);
          setTaskReport(tasks);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setPointsReport(null);
          setTaskReport(null);
          setError(e instanceof Error && (e.message.includes("请先切换到家长模式") || e.message.includes("403")) ? "请先切换到家长模式" : "加载失败，请重试");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, dateStr]);

  const handlePrev = () => setDateStr(addPeriod(period, dateStr, -1));
  const handleNext = () => {
    const next = addPeriod(period, dateStr, 1);
    if (next <= today) setDateStr(next);
  };
  const canGoNext = addPeriod(period, dateStr, 1) <= today;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <h1 className="text-xl font-semibold text-p-text">数据报告</h1>

      {/* Period & Date selector */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-p-border bg-p-card p-0.5">
          <button
            onClick={() => setPeriod("week")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === "week" ? "bg-p-accent text-white" : "text-p-text-secondary hover:bg-gray-100"
            }`}
          >
            按周
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === "month" ? "bg-p-accent text-white" : "text-p-text-secondary hover:bg-gray-100"
            }`}
          >
            按月
          </button>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1">
          <button
            onClick={handlePrev}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-p-border bg-p-card text-p-text-secondary hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium text-p-text">
            {formatPeriodLabel(period, dateStr)}
          </span>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-p-border bg-p-card text-p-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center text-sm text-p-text-secondary">加载中...</div>
      )}

      {!loading && (pointsReport || taskReport) && (
        <div className="flex flex-col gap-4">
          {/* Points report */}
          {pointsReport && (
            <div className="rounded-xl border border-p-border bg-gradient-to-br from-amber-50 to-orange-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-amber-600" />
                <span className="font-medium text-p-text">积分维度</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="flex items-center gap-2 text-p-text-secondary text-sm">
                    <TrendingUp size={14} />
                    获得积分
                  </div>
                  <p className={`mt-1 text-xl font-bold ${pointsReport.taskEarned >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {pointsReport.taskEarned >= 0 ? "+" : ""}{pointsReport.taskEarned}
                  </p>
                  <p className="text-xs text-p-text-secondary mt-0.5">任务奖励合计</p>
                </div>
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="flex items-center gap-2 text-p-text-secondary text-sm">
                    <TrendingDown size={14} />
                    消耗积分
                  </div>
                  <p className="mt-1 text-xl font-bold text-red-500">
                    -{pointsReport.exchangeCost}
                  </p>
                  <p className="text-xs text-p-text-secondary mt-0.5">兑换奖励消耗</p>
                </div>
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="flex items-center gap-2 text-p-text-secondary text-sm">
                    <Wallet size={14} />
                    期初余额
                  </div>
                  <p className="mt-1 text-xl font-bold text-p-text">{pointsReport.startBalance}</p>
                </div>
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="flex items-center gap-2 text-p-text-secondary text-sm">
                    <Wallet size={14} />
                    期末余额
                  </div>
                  <p className="mt-1 text-xl font-bold text-p-text">{pointsReport.endBalance}</p>
                </div>
              </div>
              {pointsReport.exchangeRefund > 0 && (
                <div className="mt-3 rounded-lg bg-white/80 px-4 py-2 text-sm">
                  <span className="text-p-text-secondary">兑换退款：</span>
                  <span className="font-medium text-blue-600">+{pointsReport.exchangeRefund}</span>
                </div>
              )}
            </div>
          )}

          {/* Task report */}
          {taskReport && (
            <div className="rounded-xl border border-p-border bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks size={20} className="text-blue-600" />
                <span className="font-medium text-p-text">任务维度</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="text-p-text-secondary text-sm">完成任务总数</div>
                  <p className="mt-1 text-xl font-bold text-p-text">{taskReport.totalCompleted}</p>
                </div>
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="text-p-text-secondary text-sm">获得积分</div>
                  <p className={`mt-1 text-xl font-bold ${taskReport.pointsAwarded >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {taskReport.pointsAwarded >= 0 ? "+" : ""}{taskReport.pointsAwarded}
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="text-p-text-secondary text-sm">每日任务</div>
                  <p className="mt-1 text-xl font-bold text-p-text">{taskReport.dailyCompleted}</p>
                  <p className="text-xs text-p-text-secondary mt-0.5">
                    完成率 {taskReport.dailyRate}% · 共 {taskReport.dailyTaskCount} 项
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="text-p-text-secondary text-sm">每周任务</div>
                  <p className="mt-1 text-xl font-bold text-p-text">{taskReport.weeklyCompleted}</p>
                  <p className="text-xs text-p-text-secondary mt-0.5">
                    完成率 {taskReport.weeklyRate}% · 共 {taskReport.weeklyTaskCount} 项
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 p-4 col-span-2">
                  <div className="text-p-text-secondary text-sm">规则任务</div>
                  <p className="mt-1 text-xl font-bold text-p-text">{taskReport.ruleCompleted} 次</p>
                  <p className="text-xs text-p-text-secondary mt-0.5">共 {taskReport.ruleTaskCount} 项</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !pointsReport && !taskReport && (
        <p className="py-12 text-center text-sm text-p-text-secondary">{error ?? "加载失败，请重试"}</p>
      )}
    </div>
  );
}
