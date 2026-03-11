"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, Check, Pencil, Trash2, CalendarDays, CalendarRange } from "lucide-react";
import { Task, TaskType } from "@/types";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, confirmTask, getTasksWithStatus } = useData();
  const tasksWithStatus = getTasksWithStatus();

  const [tab, setTab] = useState<"all" | "DAILY" | "WEEKLY">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("DAILY");
  const [points, setPoints] = useState("10");

  const filtered = tab === "all" ? tasksWithStatus : tasksWithStatus.filter((t) => t.type === tab);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setType("DAILY");
    setPoints("10");
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setName(task.name);
    setDescription(task.description ?? "");
    setType(task.type);
    setPoints(String(task.points));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const pts = parseInt(points) || 0;
    if (pts <= 0) return;

    try {
      if (editing) {
        await updateTask(editing.id, { name: name.trim(), description: description.trim() || undefined, type, points: pts });
      } else {
        await addTask({ name: name.trim(), description: description.trim() || undefined, type, points: pts, isActive: true });
      }
      setModalOpen(false);
    } catch {
      // ignore
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        await deleteTask(deleteId);
        setDeleteId(null);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-p-text">任务管理</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          新建任务
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["all", "DAILY", "WEEKLY"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
              tab === t ? "bg-white text-p-text shadow-sm" : "text-p-text-secondary hover:text-p-text",
            )}
          >
            {t === "all" ? "全部" : t === "DAILY" ? "每日" : "每周"}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-p-text-secondary">暂无任务，点击右上角创建</p>
        )}
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
                <Badge variant={task.type === "DAILY" ? "default" : "warning"}>
                  {task.type === "DAILY" ? "每日" : "每周"}
                </Badge>
                {task.status === "completed" && <Badge variant="success">已完成</Badge>}
              </div>
              {task.description && (
                <p className="text-xs text-p-text-secondary mt-1 truncate">{task.description}</p>
              )}
              <p className="text-xs text-p-accent font-medium mt-1">+{task.points} 积分</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {task.status === "pending" && (
                <Button size="sm" onClick={async () => { try { await confirmTask(task.id); } catch { /* ignore */ } }}>
                  <Check size={14} className="mr-1" />
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

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑任务" : "新建任务"}>
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
            </div>
          </div>

          <Input
            label="积分奖励"
            type="number"
            min={1}
            placeholder="10"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />

          <div className="flex gap-3 mt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              取消
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {editing ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="删除任务"
        message="删除后不可恢复，确定要删除这个任务吗？"
      />
    </div>
  );
}
