export type TaskType = "DAILY" | "WEEKLY" | "RULE";

export interface Task {
  id: string;
  name: string;
  description?: string;
  type: TaskType;
  maxPoints: number;
  penaltyPoints: number;
  isActive: boolean;
  createdAt: string;
}

export type TaskStatus = "pending" | "completed" | "expired";

export interface TaskWithStatus extends Task {
  status: TaskStatus;
  completedAt?: string;
}

export interface TaskLog {
  id: string;
  taskId: string;
  taskName: string;
  pointsAwarded: number;
  completedAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  points: number;
  isActive: boolean;
  createdAt: string;
}

export type ExchangeStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";

export interface Exchange {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  status: ExchangeStatus;
  rejectReason?: string;
  createdAt: string;
  confirmedAt?: string;
}

export type PointsLogType = "TASK_REWARD" | "TASK_REWARD_UNDO" | "TASK_PENALTY" | "TASK_PENALTY_UNDO" | "EXCHANGE_COST" | "EXCHANGE_REFUND";

export interface PointsLog {
  id: string;
  amount: number;
  type: PointsLogType;
  description: string;
  balance: number;
  createdAt: string;
}

export interface StudentData {
  nickname: string;
  totalPoints: number;
  balance: number;
  frozenPoints: number;
  streakDays: number;
  lastActiveDate?: string;
  /** 机甲积分（领养后任务获得，兑换不扣） */
  mechaPoints?: number;
}

export interface MechaStage {
  stage: number;
  name: string;
  threshold: number;
  description: string;
}

export interface MechaState {
  currentStage: number;
  evolutionLevel: number;
  totalPoints: number;
  name?: string;
  colorScheme: string;
}

export interface ParentUser {
  email: string;
  pin: string;
  childNickname: string;
}

export type AppMode = "parent" | "student";
