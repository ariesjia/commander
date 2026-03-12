"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "确认操作",
  message,
  confirmLabel = "确认删除",
  cancelLabel = "取消",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose}>
      <div className="flex flex-col items-center gap-4 pt-2">
        <div className={variant === "danger" ? "flex h-12 w-12 items-center justify-center rounded-full bg-red-50" : "flex h-12 w-12 items-center justify-center rounded-full bg-p-accent/10"}>
          <AlertTriangle size={22} className={variant === "danger" ? "text-p-danger" : "text-p-accent"} />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-p-text">{title}</h3>
          <p className="mt-1.5 text-sm text-p-text-secondary">{message}</p>
        </div>
        <div className="flex w-full gap-3 mt-2">
          <Button variant="secondary" onClick={() => { if (!loading) onClose(); }} className="flex-1" disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} className="flex-1" loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
