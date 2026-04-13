"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Task,
  Reward,
  Exchange,
  PointsLog,
  StudentData,
  TaskWithStatus,
  type MaintenanceMathStatus,
  type DrivingGuideStatus,
  type MechaChatStatus,
} from "@/types";
import { api } from "@/lib/api";
import { useMode } from "@/contexts/ModeContext";
import { getCurrentStage, getEvolutionLevel } from "@/lib/mecha-config";
import type { BaseScore } from "@/lib/score-display";

interface DataState {
  tasks: Task[];
  rewards: Reward[];
  exchanges: Exchange[];
  pointsLogs: PointsLog[];
  student: StudentData;
  mechaStage: number;
  adoptedMechaIds: string[];
  adoptedMechas: { id: string; slug: string; points: number }[];
  mechaPointsBySlug: Record<string, number>;
  evolutionLevel: number;
  mechaName: string | null;
  mechaLevelName: string | null;
  showPinyin: boolean;
  updateShowPinyin: (show: boolean) => Promise<void>;
  baseScore: BaseScore;
  updateBaseScore: (v: BaseScore) => Promise<void>;
  maintenanceMath: MaintenanceMathStatus;
  updateMaintenanceMathEnabled: (enabled: boolean) => Promise<void>;
  drivingGuide: DrivingGuideStatus;
  updateDrivingGuideEnabled: (enabled: boolean) => Promise<void>;
  mechaChat: MechaChatStatus;
  updateMechaChatEnabled: (enabled: boolean) => Promise<void>;
  /** 每日战斗所需当日任务积分门槛（0–10，0 表示不门槛） */
  dailyBattleMinTaskPoints: number;
  updateDailyBattleMinTaskPoints: (n: number) => Promise<void>;

  addTask: (t: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, t: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  confirmTask: (taskId: string, options?: { pointsAwarded?: number; penaltyAmount?: number; isPenalty?: boolean }) => Promise<void>;
  undoPointsLog: (pointsLogId: string) => Promise<void>;

  addReward: (r: Omit<Reward, "id" | "createdAt">) => Promise<void>;
  updateReward: (id: string, r: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;

  requestExchange: (rewardId: string) => Promise<boolean>;
  cancelExchange: (exchangeId: string) => Promise<void>;
  confirmExchange: (exchangeId: string) => Promise<void>;
  rejectExchange: (exchangeId: string, reason?: string) => Promise<void>;

  getTasksWithStatus: () => TaskWithStatus[];
  pendingExchanges: Exchange[];
  weeklyCompletedCount: number;
  weeklyTotalCount: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

const defaultStudent: StudentData = {
  nickname: "",
  totalPoints: 0,
  balance: 0,
  frozenPoints: 0,
  streakDays: 0,
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useMode();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pointsLogs, setPointsLogs] = useState<PointsLog[]>([]);
  const [student, setStudent] = useState<StudentData>(defaultStudent);
  const [tasksWithStatus, setTasksWithStatus] = useState<TaskWithStatus[]>([]);
  const [pendingExchanges, setPendingExchanges] = useState<Exchange[]>([]);
  const [weeklyCompletedCount, setWeeklyCompletedCount] = useState(0);
  const [weeklyTotalCount, setWeeklyTotalCount] = useState(0);
  const [mechaStage, setMechaStage] = useState(0);
  const [evolutionLevel, setEvolutionLevel] = useState(0);
  const [adoptedMechaIds, setAdoptedMechaIds] = useState<string[]>([]);
  const [adoptedMechas, setAdoptedMechas] = useState<{ id: string; slug: string; points: number }[]>([]);
  const [mechaPointsBySlug, setMechaPointsBySlug] = useState<Record<string, number>>({});
  const [mechaName, setMechaName] = useState<string | null>(null);
  const [mechaLevelName, setMechaLevelName] = useState<string | null>(null);
  const [showPinyin, setShowPinyin] = useState(false);
  const [baseScore, setBaseScore] = useState<BaseScore>(1);
  const [maintenanceMath, setMaintenanceMath] = useState<MaintenanceMathStatus>({
    enabled: true,
    completedToday: false,
    date: "",
  });
  const [drivingGuide, setDrivingGuide] = useState<DrivingGuideStatus>({
    enabled: true,
    completedToday: false,
    date: "",
  });
  const [mechaChat, setMechaChat] = useState<MechaChatStatus>({ enabled: true });
  const [dailyBattleMinTaskPoints, setDailyBattleMinTaskPoints] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (mode === "parent") {
      try {
        const [dashboard, tasksRes, rewardsRes, exchangesRes, pointsRes] = await Promise.all([
          api.get<{
            student: StudentData;
            weeklyCompletedCount: number;
            weeklyTotalCount: number;
            mechaStage?: number;
            evolutionLevel?: number;
            mechaName?: string | null;
            mechaLevelName?: string | null;
            adoptedMechaIds?: string[];
            adoptedMechas?: { id: string; slug: string; points: number }[];
            mechaPointsBySlug?: Record<string, number>;
            showPinyin?: boolean;
            baseScore?: number;
            maintenanceMath?: MaintenanceMathStatus;
            drivingGuide?: DrivingGuideStatus;
            mechaChat?: MechaChatStatus;
            dailyBattleMinTaskPoints?: number;
          }>("/api/parent/dashboard"),
          api.get<Array<Task & { status: string; completedAt?: string }>>("/api/parent/tasks"),
          api.get<Reward[]>("/api/parent/rewards"),
          api.get<{ pending: Exchange[]; all: Exchange[] }>("/api/parent/exchanges"),
          api.get<PointsLog[]>("/api/parent/points-log"),
        ]);
        setStudent(dashboard.student);
        setWeeklyCompletedCount(dashboard.weeklyCompletedCount);
        setWeeklyTotalCount(dashboard.weeklyTotalCount);
        setPendingExchanges(exchangesRes.pending);
        setTasksWithStatus(
          tasksRes.map((t) => ({
            ...t,
            status: (t.status || "pending") as "pending" | "completed" | "expired",
            completedAt: t.completedAt,
          }))
        );
        setTasks(tasksRes);
        setRewards(rewardsRes);
        setExchanges(exchangesRes.all);
        setPointsLogs(pointsRes);
        setMechaStage(dashboard.mechaStage ?? getCurrentStage(dashboard.student.totalPoints));
        setEvolutionLevel(dashboard.evolutionLevel ?? getEvolutionLevel(dashboard.student.totalPoints));
        setMechaName(dashboard.mechaName ?? null);
        setMechaLevelName(dashboard.mechaLevelName ?? null);
        setAdoptedMechaIds(dashboard.adoptedMechaIds ?? []);
        setAdoptedMechas(dashboard.adoptedMechas ?? []);
        setMechaPointsBySlug(dashboard.mechaPointsBySlug ?? {});
        setShowPinyin(dashboard.showPinyin ?? false);
        setBaseScore((dashboard.baseScore ?? 1) as BaseScore);
        if (dashboard.maintenanceMath) {
          setMaintenanceMath(dashboard.maintenanceMath);
        }
        if (dashboard.drivingGuide) {
          setDrivingGuide(dashboard.drivingGuide);
        }
        if (dashboard.mechaChat) {
          setMechaChat(dashboard.mechaChat);
        }
        if (typeof dashboard.dailyBattleMinTaskPoints === "number") {
          setDailyBattleMinTaskPoints(dashboard.dailyBattleMinTaskPoints);
        }
      } catch {
        // not logged in or error
      }
    } else {
      try {
        const [profile, tasksRes, rewardsRes, exchangesRes, pointsRes] = await Promise.all([
          api.get<
            StudentData & {
              mechaStage: number;
              evolutionLevel: number;
              adoptedMechaIds?: string[];
              adoptedMechas?: { id: string; slug: string; points: number }[];
              mechaPointsBySlug?: Record<string, number>;
              showPinyin?: boolean;
              baseScore?: number;
              maintenanceMath?: MaintenanceMathStatus;
              drivingGuide?: DrivingGuideStatus;
              mechaChat?: MechaChatStatus;
            }
          >("/api/student/profile"),
          api.get<TaskWithStatus[]>("/api/student/tasks"),
          api.get<Array<Reward & { canRedeem?: boolean; pointsNeeded?: number }>>("/api/student/rewards"),
          api.get<Exchange[]>("/api/student/exchanges"),
          api.get<PointsLog[]>("/api/student/points-log"),
        ]);
        setStudent({
          nickname: profile.nickname,
          totalPoints: profile.totalPoints,
          balance: profile.balance,
          frozenPoints: profile.frozenPoints,
          streakDays: profile.streakDays,
        });
        setTasksWithStatus(tasksRes);
        setTasks(tasksRes);
        setRewards(rewardsRes);
        setExchanges(exchangesRes);
        setPointsLogs(pointsRes);
        setPendingExchanges(exchangesRes.filter((e) => e.status === "PENDING"));
        setMechaStage(profile.mechaStage);
        setEvolutionLevel(profile.evolutionLevel);
        setAdoptedMechaIds(profile.adoptedMechaIds ?? []);
        setAdoptedMechas(profile.adoptedMechas ?? []);
        setMechaPointsBySlug(profile.mechaPointsBySlug ?? {});
        setShowPinyin(profile.showPinyin ?? false);
        setBaseScore((profile.baseScore ?? 1) as BaseScore);
        if (profile.maintenanceMath) {
          setMaintenanceMath(profile.maintenanceMath);
        }
        if (profile.drivingGuide) {
          setDrivingGuide(profile.drivingGuide);
        }
        if (profile.mechaChat) {
          setMechaChat(profile.mechaChat);
        }
        setWeeklyCompletedCount(0);
        setWeeklyTotalCount(0);
      } catch {
        // not logged in or error
      }
    }
    setIsLoading(false);
  }, [mode]);

  useEffect(() => {
    setIsLoading(true);
    refetch();
  }, [refetch]);

  const getTasksWithStatus = useCallback(() => tasksWithStatus, [tasksWithStatus]);

  const addTask = useCallback(async (t: Omit<Task, "id" | "createdAt">) => {
    await api.post("/api/parent/tasks", t);
    await refetch();
  }, [refetch]);

  const updateTask = useCallback(async (id: string, t: Partial<Task>) => {
    await api.put(`/api/parent/tasks/${id}`, t);
    await refetch();
  }, [refetch]);

  const deleteTask = useCallback(async (id: string) => {
    await api.delete(`/api/parent/tasks/${id}`);
    await refetch();
  }, [refetch]);

  const confirmTask = useCallback(async (taskId: string, options?: { pointsAwarded?: number; penaltyAmount?: number; isPenalty?: boolean }) => {
    await api.post(`/api/parent/tasks/${taskId}/confirm`, options ?? {});
    await refetch();
  }, [refetch]);

  const undoPointsLog = useCallback(async (pointsLogId: string) => {
    await api.post(`/api/parent/points-log/${pointsLogId}/undo`);
    await refetch();
  }, [refetch]);

  const addReward = useCallback(async (r: Omit<Reward, "id" | "createdAt">) => {
    await api.post("/api/parent/rewards", r);
    await refetch();
  }, [refetch]);

  const updateReward = useCallback(async (id: string, r: Partial<Reward>) => {
    await api.put(`/api/parent/rewards/${id}`, r);
    await refetch();
  }, [refetch]);

  const deleteReward = useCallback(async (id: string) => {
    await api.delete(`/api/parent/rewards/${id}`);
    await refetch();
  }, [refetch]);

  const requestExchange = useCallback(async (rewardId: string): Promise<boolean> => {
    try {
      await api.post("/api/student/exchanges", { rewardId });
      await refetch();
      return true;
    } catch {
      return false;
    }
  }, [refetch]);

  const cancelExchange = useCallback(async (exchangeId: string) => {
    await api.post(`/api/student/exchanges/${exchangeId}/cancel`);
    await refetch();
  }, [refetch]);

  const confirmExchange = useCallback(async (exchangeId: string) => {
    await api.post(`/api/parent/exchanges/${exchangeId}/confirm`);
    await refetch();
  }, [refetch]);

  const rejectExchange = useCallback(async (exchangeId: string, reason?: string) => {
    await api.post(`/api/parent/exchanges/${exchangeId}/reject`, { reason });
    await refetch();
  }, [refetch]);

  const updateShowPinyin = useCallback(async (show: boolean) => {
    await api.put("/api/parent/settings", { showPinyin: show });
    setShowPinyin(show);
  }, []);

  const updateBaseScore = useCallback(async (v: BaseScore) => {
    await api.put("/api/parent/settings", { baseScore: v });
    setBaseScore(v);
    await refetch();
  }, [refetch]);

  const updateMaintenanceMathEnabled = useCallback(
    async (enabled: boolean) => {
      await api.put("/api/parent/settings", { maintenanceMathEnabled: enabled });
      setMaintenanceMath((prev) => ({ ...prev, enabled }));
      await refetch();
    },
    [refetch],
  );

  const updateDailyBattleMinTaskPoints = useCallback(
    async (n: number) => {
      await api.put("/api/parent/settings", { dailyBattleMinTaskPoints: n });
      setDailyBattleMinTaskPoints(n);
      await refetch();
    },
    [refetch],
  );

  const updateDrivingGuideEnabled = useCallback(
    async (enabled: boolean) => {
      await api.put("/api/parent/settings", { drivingGuideEnabled: enabled });
      setDrivingGuide((prev) => ({ ...prev, enabled }));
      await refetch();
    },
    [refetch],
  );

  const updateMechaChatEnabled = useCallback(
    async (enabled: boolean) => {
      await api.put("/api/parent/settings", { mechaChatEnabled: enabled });
      setMechaChat((prev) => ({ ...prev, enabled }));
      await refetch();
    },
    [refetch],
  );

  return (
    <DataContext.Provider
      value={{
        tasks,
        rewards,
        exchanges,
        pointsLogs,
        student,
        mechaStage,
        adoptedMechaIds,
        adoptedMechas,
        mechaPointsBySlug,
        evolutionLevel,
        mechaName,
        mechaLevelName,
        showPinyin,
        updateShowPinyin,
        baseScore,
        updateBaseScore,
        maintenanceMath,
        updateMaintenanceMathEnabled,
        drivingGuide,
        updateDrivingGuideEnabled,
        mechaChat,
        updateMechaChatEnabled,
        dailyBattleMinTaskPoints,
        updateDailyBattleMinTaskPoints,
        addTask,
        updateTask,
        deleteTask,
        confirmTask,
        undoPointsLog,
        addReward,
        updateReward,
        deleteReward,
        requestExchange,
        cancelExchange,
        confirmExchange,
        rejectExchange,
        getTasksWithStatus,
        pendingExchanges,
        weeklyCompletedCount,
        weeklyTotalCount,
        isLoading,
        refetch,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
