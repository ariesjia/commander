"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMode } from "@/contexts/ModeContext";

export function ModeTransition() {
  const { isTransitioning, mode } = useMode();

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                mode === "student"
                  ? "linear-gradient(135deg, #0F172A, #1E1B4B)"
                  : "#FAFAFA",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            className="relative z-10 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            {mode === "student" ? (
              <p className="font-display text-xl font-bold text-cyan-400 neon-text">
                系统启动中...
              </p>
            ) : (
              <p className="text-lg font-semibold text-gray-500">
                返回管理界面...
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
