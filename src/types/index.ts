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

export type PointsLogType =
  | "TASK_REWARD"
  | "TASK_REWARD_UNDO"
  | "TASK_PENALTY"
  | "TASK_PENALTY_UNDO"
  | "EXCHANGE_COST"
  | "EXCHANGE_REFUND"
  | "BATTLE_REWARD";

/** 今日战斗重放（与 GET /api/student/battle 中 todayReplay 一致） */
export interface TodayBattleReplay {
  outcome: "WIN" | "LOSE";
  narrative: string;
  enemy: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    skills: string[];
  };
  pointsAwarded: number;
  rewards: { kind: string; amount?: number; itemSlug?: string; quantity?: number }[];
}

/** 与 GET /api/student/battle、profile.battleStatus 一致 */
export interface BattleStatus {
  timezone: string;
  date: string;
  taskPointsToday: number;
  minPointsRequired: number;
  canFight: boolean;
  foughtToday: boolean;
  reasonCode: "THRESHOLD_NOT_MET" | "ALREADY_FOUGHT_TODAY" | null;
  message: string;
  todayReplay: TodayBattleReplay | null;
}

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
