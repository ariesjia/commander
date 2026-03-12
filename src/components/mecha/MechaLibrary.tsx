"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, X } from "lucide-react";
import {
  MECHA_XUANJIA,
  MECHA_SECOND,
  getXuanjiaLevelInfo,
  XUANJIA_INTRO,
  MECHA_SECOND_INFO,
} from "@/lib/mecha-adoption";

interface MechaLibraryProps {
  adoptedMechaIds: string[];
  totalPoints: number;
}

export function MechaLibrary({ adoptedMechaIds, totalPoints }: MechaLibraryProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mechaList = adoptedMechaIds.map((id) => {
    if (id === MECHA_XUANJIA) {
      const level = getXuanjiaLevelInfo(totalPoints);
      return {
        id: MECHA_XUANJIA,
        name: "玄甲",
        imageUrl: level.imageUrl,
        levelName: level.name,
        description: level.description,
        intro: XUANJIA_INTRO,
      };
    }
    if (id === MECHA_SECOND) {
      return {
        id: MECHA_SECOND,
        name: MECHA_SECOND_INFO.name,
        imageUrl: MECHA_SECOND_INFO.imageUrl,
        levelName: null,
        description: MECHA_SECOND_INFO.description,
        intro: MECHA_SECOND_INFO.description,
      };
    }
    return null;
  }).filter(Boolean) as Array<{
    id: string;
    name: string;
    imageUrl: string;
    levelName: string | null;
    description: string;
    intro: string;
  }>;

  const selected = selectedId ? mechaList.find((m) => m.id === selectedId) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-s-primary/30 bg-s-primary/5 px-4 py-2.5 text-sm text-s-primary transition-colors hover:bg-s-primary/10"
      >
        <Library size={18} />
        机甲库
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl bg-[#0c1222] border border-s-primary/20 shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-s-primary/20">
                <h2 className="text-lg font-semibold text-s-text">机甲库</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-s-text-secondary hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                {selected ? (
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => setSelectedId(null)}
                      className="text-xs text-s-text-secondary hover:text-s-primary self-start"
                    >
                      ← 返回列表
                    </button>
                    <div className="flex justify-center">
                      <img
                        src={selected.imageUrl}
                        alt={selected.name}
                        className="w-48 h-60 object-contain rounded-lg bg-s-card/30"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                    <div>
                      <h3 className="text-s-primary font-display text-xl font-bold">{selected.name}</h3>
                      {selected.levelName && (
                        <p className="text-s-text-secondary text-sm mt-0.5">{selected.levelName}</p>
                      )}
                      <p className="text-s-text text-sm mt-3 leading-relaxed">{selected.intro}</p>
                      <p className="text-s-text-secondary text-sm mt-2 leading-relaxed">{selected.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {mechaList.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedId(m.id)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-s-primary/20 bg-s-card/30 p-4 transition-all hover:border-s-primary/50 hover:bg-s-primary/10"
                      >
                        <img
                          src={m.imageUrl}
                          alt={m.name}
                          className="w-20 h-24 object-contain rounded-lg"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <span className="text-sm font-medium text-s-text">{m.name}</span>
                        {m.levelName && (
                          <span className="text-xs text-s-text-secondary">{m.levelName}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
