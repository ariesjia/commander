"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, Check, Pencil, Trash2, CalendarDays, CalendarRange } from "lucide-react";
import { Task, TaskType } from "@/types";
import { cn } from "@/lib/utils";
import { toDisplay, toDb, getSliderStep } from "@/lib/score-display";

export default function TasksPage() {
  const { addTask, updateTask, deleteTask, confirmTask, getTasksWithStatus, isLoading, baseScore } = useData();
  const { toast } = useToast();
  const tasksWithStatus = getTasksWithStatus();

  const [tab, setTab] = useState<"all" | "DAILY" | "WEEKLY" | "RULE">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmTaskId, setConfirmTaskId] = useState<string | null>(null);
  const [confirmPoints, setConfirmPoints] = useState<number>(10);
  const [confirmPenaltyAmount, setConfirmPenaltyAmount] = useState<number>(5);
  const [confirmIsPenalty, setConfirmIsPenalty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("DAILY");
  const [ruleKind, setRuleKind] = useState<"reward" | "penalty">("reward"); // 规则子类型：奖励 or 惩罚
  const [maxPoints, setMaxPoints] = useState("10");
  const [penaltyPoints, setPenaltyPoints] = useState("5");

  const filtered = tab === "all" ? tasksWithStatus : tasksWithStatus.filter((t) => t.type === tab);

  // 选「全部」时按任务类型分组：每日 → 每周 → 规则
  const typeOrder: TaskType[] = ["DAILY", "WEEKLY", "RULE"];
  const typeLabels: Record<TaskType, string> = { DAILY: "每日", WEEKLY: "每周", RULE: "规则" };
  const showGrouped = tab === "all";
  const grouped = showGrouped
    ? typeOrder
        .map((type) => ({ type, tasks: filtered.filter((t) => t.type === type) }))
        .filter((g) => g.tasks.length > 0)
    : [{ type: tab, tasks: filtered }];

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-p-accent border-t-transparent" />
        <p className="text-sm text-p-text-secondary">加载中...</p>
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setType("DAILY");
    setRuleKind("reward");
    setMaxPoints(String(toDisplay(10, baseScore)));
    setPenaltyPoints(String(toDisplay(5, baseScore)));
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setName(task.name);
    setDescription(task.description ?? "");
    setType(task.type);
    const pen = task.penaltyPoints ?? 0;
    setRuleKind(pen > 0 ? "penalty" : "reward");
    setMaxPoints(String(toDisplay(task.maxPoints, baseScore)));
    setPenaltyPoints(pen > 0 ? String(toDisplay(pen, baseScore)) : String(toDisplay(5, baseScore)));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast("请输入任务名称", "error");
      return;
    }
    const ptsDb = toDb(parseFloat(maxPoints) || 0, baseScore);
    const penaltyDb = toDb(parseFloat(penaltyPoints) || 0, baseScore);

    if (type === "RULE") {
      if (ruleKind === "reward") {
        if (ptsDb <= 0) {
          toast("奖励积分需大于 0", "error");
          return;
        }
      } else {
        if (penaltyDb <= 0) {
          toast("惩罚扣分需大于 0", "error");
          return;
        }
      }
    } else {
      if (ptsDb <= 0) {
        toast("最大得分需大于 0", "error");
        return;
      }
    }

    const finalMaxPoints = type === "RULE" && ruleKind === "penalty" ? 0 : ptsDb;
    const finalPenalty = type === "RULE" && ruleKind === "penalty" ? penaltyDb : 0;

    setSaving(true);
    try {
      if (editing) {
        await updateTask(editing.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          maxPoints: finalMaxPoints,
          penaltyPoints: finalPenalty,
        });
        toast("任务已更新");
      } else {
        await addTask({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          maxPoints: finalMaxPoints,
          penaltyPoints: finalPenalty,
          isActive: true,
        });
        toast("任务创建成功");
      }
      setModalOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "操作失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      setDeleting(true);
      try {
        await deleteTask(deleteId);
        setDeleteId(null);
      } catch {
        // ignore
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleConfirmTask = async () => {
    if (confirmTaskId) {
      // 主按钮 disabled 后浏览器会把焦点移到弹层里更靠前的可聚焦元素（上面的 range），
      // WebKit 上滑块聚焦会像「select」高亮；先移出焦点避免该现象。
      (document.activeElement as HTMLElement | null)?.blur?.();
      setConfirming(true);
      try {
        await confirmTask(confirmTaskId, {
          pointsAwarded: confirmIsPenalty ? undefined : toDb(confirmPoints, baseScore),
          penaltyAmount: confirmIsPenalty ? toDb(confirmPenaltyAmount, baseScore) : undefined,
          isPenalty: confirmIsPenalty,
        });
        toast(confirmIsPenalty ? "已记录惩罚" : "任务已确认完成");
        setConfirmTaskId(null);
      } catch {
        // ignore
      } finally {
        setConfirming(false);
      }
    }
  };

  const openConfirmDialog = (taskId: string) => {
    const task = tasksWithStatus.find((t) => t.id === taskId);
    const isPenaltyOnly = task?.type === "RULE" && (task.penaltyPoints ?? 0) > 0 && (task.maxPoints ?? 0) === 0;
    setConfirmTaskId(taskId);
    setConfirmPoints(toDisplay(task?.maxPoints ?? 10, baseScore));
    setConfirmPenaltyAmount(toDisplay(task?.penaltyPoints ?? 5, baseScore));
    setConfirmIsPenalty(!!isPenaltyOnly);
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-p-text">任务管理</h1>
          <p className="mt-1 text-sm text-p-text-secondary">建议参考机甲图鉴的升级积分来设置任务分数，让孩子更有动力</p>
        </div>
        <Button size="sm" onClick={openCreate} className="whitespace-nowrap shrink-0">
          <Plus size={16} className="mr-1.5 shrink-0" />
          新建任务
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["all", "DAILY", "WEEKLY", "RULE"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
              tab === t ? "bg-white text-p-text shadow-sm" : "text-p-text-secondary hover:text-p-text",
            )}
          >
            {t === "all" ? "全部" : t === "DAILY" ? "每日" : t === "WEEKLY" ? "每周" : "规则"}
          </button>
        ))}
      </div>

      {/* Task list - 选「全部」时按类型分组显示，非全部时不展示分组标题 */}
      <div className="flex flex-col gap-5">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-p-text-secondary">暂无任务，点击右上角创建</p>
        )}
        {showGrouped ? (
          grouped.map(({ type, tasks }) => (
            <div key={type} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {type === "DAILY" && <CalendarDays size={16} className="text-p-accent" />}
                {type === "WEEKLY" && <CalendarRange size={16} className="text-amber-500" />}
                {type === "RULE" && <span className="text-base">📋</span>}
                <h2 className="text-sm font-semibold text-p-text">{typeLabels[type]}</h2>
                <span className="text-xs text-p-text-secondary">({tasks.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-p-border bg-p-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-medium text-p-text", task.status === "completed" && "line-through opacity-60")}>
                        {task.name}
                      </span>
                      <Badge variant={task.type === "DAILY" ? "default" : task.type === "WEEKLY" ? "warning" : "neon"}>
                        {task.type === "DAILY" ? "每日" : task.type === "WEEKLY" ? "每周" : "规则"}
                      </Badge>
                      {task.status === "completed" && <Badge variant="success">已完成</Badge>}
                    </div>
                    {task.description && (
                      <p className="text-xs text-p-text-secondary mt-1 truncate">{task.description}</p>
                    )}
                    <p className="text-xs font-medium mt-1">
                      {task.type === "RULE" && (task.penaltyPoints ?? 0) > 0 ? (
                        <span className="text-red-600">扣分 · 违反扣 {toDisplay(task.penaltyPoints ?? 0, baseScore)} 分</span>
                      ) : (
                        <span className="text-green-600">加分 · 完成可得 {toDisplay(task.maxPoints ?? 0, baseScore)} 分</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.status === "pending" && (
                      <Button size="sm" onClick={() => openConfirmDialog(task.id)} className="whitespace-nowrap">
                        <Check size={14} className="mr-1 shrink-0" />
                        确认
                      </Button>
                    )}
                    <button
                      onClick={() => openEdit(task)}
                      className="rounded-lg p-2 text-p-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(task.id)}
                      className="rounded-lg p-2 text-p-text-secondary hover:bg-red-50 hover:text-p-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-p-border bg-p-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-medium text-p-text", task.status === "completed" && "line-through opacity-60")}>
                        {task.name}
                      </span>
                      <Badge variant={task.type === "DAILY" ? "default" : task.type === "WEEKLY" ? "warning" : "neon"}>
                        {task.type === "DAILY" ? "每日" : task.type === "WEEKLY" ? "每周" : "规则"}
                      </Badge>
                      {task.status === "completed" && <Badge variant="success">已完成</Badge>}
                    </div>
                    {task.description && (
                      <p className="text-xs text-p-text-secondary mt-1 truncate">{task.description}</p>
                    )}
                    <p className="text-xs font-medium mt-1">
                      {task.type === "RULE" && (task.penaltyPoints ?? 0) > 0 ? (
                        <span className="text-red-600">扣分 · 违反扣 {toDisplay(task.penaltyPoints ?? 0, baseScore)} 分</span>
                      ) : (
                        <span className="text-green-600">加分 · 完成可得 {toDisplay(task.maxPoints ?? 0, baseScore)} 分</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.status === "pending" && (
                      <Button size="sm" onClick={() => openConfirmDialog(task.id)} className="whitespace-nowrap">
                        <Check size={14} className="mr-1 shrink-0" />
                        确认
                      </Button>
                    )}
                    <button
                      onClick={() => openEdit(task)}
                      className="rounded-lg p-2 text-p-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(task.id)}
                      className="rounded-lg p-2 text-p-text-secondary hover:bg-red-50 hover:text-p-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={saving ? () => {} : () => setModalOpen(false)} title={editing ? "编辑任务" : "新建任务"}>
        <div className="flex flex-col gap-4">
          <Input label="任务名称" placeholder="例如：完成数学作业" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Input label="描述（可选）" placeholder="补充说明" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-p-primary">任务类型</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("DAILY")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  type === "DAILY" ? "border-p-accent bg-p-accent/5 text-p-accent" : "border-p-border text-p-text-secondary hover:bg-gray-50",
                )}
              >
                <CalendarDays size={16} />
                每日
              </button>
              <button
                type="button"
                onClick={() => setType("WEEKLY")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  type === "WEEKLY" ? "border-p-accent bg-p-accent/5 text-p-accent" : "border-p-border text-p-text-secondary hover:bg-gray-50",
                )}
              >
                <CalendarRange size={16} />
                每周
              </button>
              <button
                type="button"
                onClick={() => setType("RULE")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  type === "RULE" ? "border-p-accent bg-p-accent/5 text-p-accent" : "border-p-border text-p-text-secondary hover:bg-gray-50",
                )}
              >
                <span className="text-base">📋</span>
                规则
              </button>
            </div>
          </div>

          {type === "RULE" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-p-primary">规则类型</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRuleKind("reward")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    ruleKind === "reward" ? "border-p-accent bg-p-accent/5 text-p-accent" : "border-p-border text-p-text-secondary hover:bg-gray-50",
                  )}
                >
                  🎁 奖励规则
                </button>
                <button
                  type="button"
                  onClick={() => setRuleKind("penalty")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    ruleKind === "penalty" ? "border-p-accent bg-p-accent/5 text-p-accent" : "border-p-border text-p-text-secondary hover:bg-gray-50",
                  )}
                >
                  ⚠️ 惩罚规则
                </button>
              </div>
            </div>
          )}

          {type !== "RULE" && (
            <Input
              label="最大得分"
              type="number"
              min={baseScore}
              step={baseScore}
              placeholder={String(toDisplay(10, baseScore))}
              value={maxPoints}
              onChange={(e) => setMaxPoints(e.target.value)}
            />
          )}
          {type === "RULE" && ruleKind === "reward" && (
            <Input
              label="奖励积分"
              type="number"
              min={baseScore}
              step={baseScore}
              placeholder={String(toDisplay(10, baseScore))}
              value={maxPoints}
              onChange={(e) => setMaxPoints(e.target.value)}
            />
          )}
          {type === "RULE" && ruleKind === "penalty" && (
            <Input
              label="惩罚扣分"
              type="number"
              min={baseScore}
              step={baseScore}
              placeholder={String(toDisplay(5, baseScore))}
              value={penaltyPoints}
              onChange={(e) => setPenaltyPoints(e.target.value)}
            />
          )}

          <div className="flex gap-3 mt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1" disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} className="flex-1" loading={saving}>
              {editing ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm task dialog */}
      <Modal
        open={!!confirmTaskId}
        onClose={confirming ? () => {} : () => setConfirmTaskId(null)}
        title="确认任务完成"
      >
        {confirmTaskId && (() => {
          const task = tasksWithStatus.find((t) => t.id === confirmTaskId);
          if (!task) return null;
          const isPenaltyOnlyRule = task.type === "RULE" && (task.penaltyPoints ?? 0) > 0 && (task.maxPoints ?? 0) === 0;

          if (isPenaltyOnlyRule) {
            const step = getSliderStep(baseScore);
            const maxDisplay = toDisplay(task.penaltyPoints, baseScore);
            const minDisplay = toDisplay(1, baseScore);
            return (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-p-text-secondary">
                  规则「{task.name}」违反最多可扣 {maxDisplay} 分
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-p-text">扣分 ({minDisplay}~{maxDisplay})</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={minDisplay}
                      max={maxDisplay}
                      step={step}
                      value={confirmPenaltyAmount}
                      disabled={confirming}
                      onChange={(e) => setConfirmPenaltyAmount(parseFloat(e.target.value))}
                      className="flex-1 min-h-9 w-full cursor-pointer accent-p-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-p-accent/40 focus-visible:ring-offset-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium w-10">-{confirmPenaltyAmount}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <Button variant="secondary" onClick={() => setConfirmTaskId(null)} className="flex-1" disabled={confirming}>
                    取消
                  </Button>
                  <Button onClick={handleConfirmTask} className="flex-1" loading={confirming}>
                    确认惩罚
                  </Button>
                </div>
              </div>
            );
          }

          const step = getSliderStep(baseScore);
          const maxDisplay = toDisplay(task.maxPoints, baseScore);
          return (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-p-text-secondary">
                任务「{task.name}」最大可得 {maxDisplay} 积分
              </p>
              {!confirmIsPenalty && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-p-text">给予积分 (0~{maxDisplay})</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={maxDisplay}
                      step={step}
                      value={confirmPoints}
                      disabled={confirming}
                      onChange={(e) => setConfirmPoints(parseFloat(e.target.value))}
                      className="flex-1 min-h-9 w-full cursor-pointer accent-p-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-p-accent/40 focus-visible:ring-offset-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium w-10">{confirmPoints}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <Button variant="secondary" onClick={() => setConfirmTaskId(null)} className="flex-1" disabled={confirming}>
                  取消
                </Button>
                <Button onClick={handleConfirmTask} className="flex-1" loading={confirming}>
                  {confirmIsPenalty ? "确认惩罚" : "确认完成"}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="删除任务"
        message="删除后不可恢复，确定要删除这个任务吗？"
        loading={deleting}
      />
    </div>
  );
}
