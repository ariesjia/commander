"use client";

import type { StudentItemRow } from "@/types/items";

export function ItemCard({ row, onSelect }: { row: StudentItemRow; onSelect: () => void }) {
  const { item, quantity } = row;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative flex flex-col items-center gap-1.5 rounded-xl border border-s-primary/20 bg-s-card/30 p-3 transition-all hover:border-s-primary/50 hover:bg-s-primary/10 text-left"
    >
      <span className="absolute right-1.5 top-1.5 min-w-[1.25rem] rounded-full bg-s-primary/90 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-[#0c1222]">
        ×{quantity}
      </span>
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-16 h-20 object-contain rounded-lg shrink-0"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span className="text-xs font-medium text-s-text line-clamp-2 w-full text-center">{item.name}</span>
    </button>
  );
}
