"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import { api } from "@/lib/api";
import type { StudentItemRow, StudentItemsResponse } from "@/types/items";
import { ItemCard } from "./ItemCard";
import { ItemDrawer } from "./ItemDrawer";

export function ItemInventoryPage({ showPinyin = false }: { showPinyin?: boolean }) {
  const [rows, setRows] = useState<StudentItemRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StudentItemRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<StudentItemsResponse>("/api/student/items")
      .then((data) => {
        if (!cancelled) setRows(data.items);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message ?? "加载失败");
          setRows(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null && !error) {
    return (
      <div className="flex flex-col min-h-[40vh] items-center justify-center gap-3 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
        <p className="text-sm text-s-text-secondary">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-sm text-red-200/90">
        {error}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300/90">
          <Package size={32} strokeWidth={1.5} />
        </div>
        <div className="space-y-1.5">
          <p className="font-display text-base font-semibold text-s-text">背包空空</p>
          <p className="text-sm leading-relaxed text-s-text-secondary max-w-sm mx-auto">
            还没有可展示的道具。完成任务或战斗后也许会获得新装备。
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {rows.map((row) => (
          <ItemCard key={row.item.slug} row={row} onSelect={() => setSelected(row)} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <ItemDrawer
            key={selected.item.slug}
            row={selected}
            showPinyin={showPinyin}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
