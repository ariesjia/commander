"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface StudentSideDrawerProps {
  onClose: () => void;
  children: ReactNode;
  /** 固定底栏（如朗读按钮） */
  footer?: ReactNode;
}

/**
 * 学生端左侧抽屉壳：蒙层 + 左滑面板 + 可滚动内容区 + 可选底栏（与机甲库 MechaDrawer 布局一致）
 */
export function StudentSideDrawer({ onClose, children, footer }: StudentSideDrawerProps) {
  const drawerContent = (
    <div className="theme-student">
      <motion.div
        className="fixed inset-0 z-[60]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>
      <motion.div
        className="fixed left-0 z-[61] w-full max-w-2xl rounded-r-2xl bg-[#0c1222] border-r border-s-primary/20 shadow-[4px_0_24px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col top-[env(safe-area-inset-top,0px)] bottom-0"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-3 top-3 z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-s-text-secondary hover:bg-white/10"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-12 pb-4 min-h-0 min-w-0">{children}</div>
        {footer ? (
          <div className="shrink-0 px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] border-t border-s-primary/20 flex flex-col gap-4">
            {footer}
          </div>
        ) : null}
      </motion.div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
}
