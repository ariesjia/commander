"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, Pencil, Trash2, Check, X, Coins } from "lucide-react";
import { Reward } from "@/types";

export default function RewardsPage() {
  const {
    rewards,
    addReward,
    updateReward,
    deleteReward,
    pendingExchanges,
    confirmExchange,
    rejectExchange,
  } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [points, setPoints] = useState("30");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setPoints("30");
    setModalOpen(true);
  };

  const openEdit = (r: Reward) => {
    setEditing(r);
    setName(r.name);
    setDescription(r.description ?? "");
    setImageUrl(r.imageUrl ?? "");
    setPoints(String(r.points));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const pts = parseInt(points) || 0;
    if (pts <= 0) return;

    const trimmedImage = imageUrl.trim() || undefined;
    try {
      if (editing) {
        await updateReward(editing.id, { name: name.trim(), description: description.trim() || undefined, imageUrl: trimmedImage, points: pts });
      } else {
        await addReward({ name: name.trim(), description: description.trim() || undefined, imageUrl: trimmedImage, points: pts, isActive: true });
      }
      setModalOpen(false);
    } catch {
      // ignore
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        await deleteReward(deleteId);
        setDeleteId(null);
      } catch {
        // ignore
      }
    }
  };

  const handleReject = async () => {
    if (rejectId) {
      try {
        await rejectExchange(rejectId, rejectReason.trim() || undefined);
        setRejectId(null);
        setRejectReason("");
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-p-text">奖励管理</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          新建奖励
        </Button>
      </div>

      {/* Pending exchanges */}
      {pendingExchanges.length > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">
            待审核兑换 ({pendingExchanges.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingExchanges.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between rounded-lg bg-white p-3 border border-amber-200"
              >
                <div>
                  <p className="font-medium text-p-text">{ex.rewardName}</p>
                  <p className="text-xs text-p-text-secondary flex items-center gap-1 mt-0.5">
                    <Coins size={12} />
                    {ex.pointsCost} 积分
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={async () => { try { await confirmExchange(ex.id); } catch { /* ignore */ } }}>
                    <Check size={14} className="mr-1" />
                    确认
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectId(ex.id)}>
                    <X size={14} className="mr-1" />
                    拒绝
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reward list */}
      <div className="flex flex-col gap-2">
        {rewards.filter((r) => r.isActive).length === 0 && (
          <p className="py-12 text-center text-sm text-p-text-secondary">暂无奖励，点击右上角创建</p>
        )}
        {rewards
          .filter((r) => r.isActive)
          .sort((a, b) => a.points - b.points)
          .map((reward) => (
            <div
              key={reward.id}
              className="flex items-center gap-3 rounded-xl border border-p-border bg-p-card p-4 transition-shadow hover:shadow-sm"
            >
              {reward.imageUrl ? (
                <img
                  src={reward.imageUrl}
                  alt={reward.name}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                  <Coins size={18} className="text-amber-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-p-text">{reward.name}</p>
                {reward.description && (
                  <p className="text-xs text-p-text-secondary mt-0.5 truncate">{reward.description}</p>
                )}
                <p className="text-xs text-amber-600 font-medium mt-0.5">{reward.points} 积分</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(reward)}
                  className="rounded-lg p-2 text-p-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteId(reward.id)}
                  className="rounded-lg p-2 text-p-text-secondary hover:bg-red-50 hover:text-p-danger transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑奖励" : "新建奖励"}>
        <div className="flex flex-col gap-4">
          <Input label="奖励名称" placeholder="例如：看一集动画片" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Input label="描述（可选）" placeholder="补充说明" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="图片URL（可选）" placeholder="https://example.com/image.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          {imageUrl.trim() && (
            <div className="flex items-center gap-3 rounded-lg border border-p-border p-2">
              <img
                src={imageUrl.trim()}
                alt="预览"
                className="h-12 w-12 rounded-lg object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="text-xs text-p-text-secondary">图片预览</span>
            </div>
          )}
          <Input label="所需积分" type="number" min={1} placeholder="30" value={points} onChange={(e) => setPoints(e.target.value)} />
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
        title="删除奖励"
        message="删除后不可恢复，确定要删除这个奖励吗？"
      />

      {/* Reject reason modal */}
      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="拒绝原因">
        <div className="flex flex-col gap-4">
          <Input
            label="拒绝原因（可选）"
            placeholder="告诉孩子为什么不行"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setRejectId(null)} className="flex-1">
              取消
            </Button>
            <Button variant="danger" onClick={handleReject} className="flex-1">
              确认拒绝
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
