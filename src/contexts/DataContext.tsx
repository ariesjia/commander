"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Task,
  Reward,
  Exchange,
  PointsLog,
  StudentData,
  TaskWithStatus,
} from "@/types";
import { api } from "@/lib/api";
import { useMode } from "@/contexts/ModeContext";
import { getCurrentStage, getEvolutionLevel } from "@/lib/mecha-config";

interface DataState {
  tasks: Task[];
  rewards: Reward[];
  exchanges: Exchange[];
  pointsLogs: PointsLog[];
  student: StudentData;
  mechaStage: number;
  adoptedMechaIds: string[];
  evolutionLevel: number;

  addTask: (t: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, t: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  confirmTask: (taskId: string) => Promise<void>;
  undoTask: (taskId: string) => Promise<void>;

  addReward: (r: Omit<Reward, "id" | "createdAt">) => Promise<void>;
  updateReward: (id: string, r: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;

  requestExchange: (rewardId: string) => Promise<boolean>;
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
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (mode === "parent") {
      try {
        const [dashboard, tasksRes, rewardsRes, exchangesRes, pointsRes] = await Promise.all([
          api.get<{
            student: StudentData;
            weeklyCompletedCount: number;
            weeklyTotalCount: number;
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
        setMechaStage(getCurrentStage(dashboard.student.totalPoints));
        setEvolutionLevel(getEvolutionLevel(dashboard.student.totalPoints));
      } catch {
        // not logged in or error
      }
    } else {
      try {
        const [profile, tasksRes, rewardsRes, exchangesRes, pointsRes] = await Promise.all([
          api.get<StudentData & { mechaStage: number; evolutionLevel: number }>("/api/student/profile"),
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

  const confirmTask = useCallback(async (taskId: string) => {
    await api.post(`/api/parent/tasks/${taskId}/confirm`);
    await refetch();
  }, [refetch]);

  const undoTask = useCallback(async (taskId: string) => {
    await api.post(`/api/parent/tasks/${taskId}/undo`);
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

  const confirmExchange = useCallback(async (exchangeId: string) => {
    await api.post(`/api/parent/exchanges/${exchangeId}/confirm`);
    await refetch();
  }, [refetch]);

  const rejectExchange = useCallback(async (exchangeId: string, reason?: string) => {
    await api.post(`/api/parent/exchanges/${exchangeId}/reject`, { reason });
    await refetch();
  }, [refetch]);

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
        evolutionLevel,
        addTask,
        updateTask,
        deleteTask,
        confirmTask,
        undoTask,
        addReward,
        updateReward,
        deleteReward,
        requestExchange,
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
