"use client";

import { Volume2, Square } from "lucide-react";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { StudentSideDrawer } from "@/components/student/StudentSideDrawer";
import { useReadAloud } from "@/hooks/useReadAloud";
import { buildItemReadAloudText } from "@/lib/item-speech";
import type { StudentItemRow } from "@/types/items";

export function ItemDrawer({
  row,
  showPinyin,
  onClose,
}: {
  row: StudentItemRow;
  showPinyin?: boolean;
  onClose: () => void;
}) {
  const { item, quantity } = row;
  const { speechSupported, isSpeaking, speak, cancel } = useReadAloud();
  const readText = buildItemReadAloudText({
    name: item.name,
    description: item.description,
    quantity,
  });

  const handleRead = () => {
    if (isSpeaking) {
      cancel();
      return;
    }
    speak(readText);
  };

  const footer = speechSupported ? (
    <button
      type="button"
      onClick={handleRead}
      className={
        "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-colors " +
        (isSpeaking ? "bg-s-primary/30 text-s-primary" : "bg-s-primary/10 text-s-primary hover:bg-s-primary/20")
      }
    >
      {isSpeaking ? (
        <>
          <Square size={18} />
          停止朗读
        </>
      ) : (
        <>
          <Volume2 size={18} />
          朗读
        </>
      )}
    </button>
  ) : undefined;

  return (
    <StudentSideDrawer onClose={onClose} footer={footer}>
      <h3 className="text-lg font-semibold text-s-primary text-center mb-4">
        <TextWithPinyin text={item.name} showPinyin={!!showPinyin} />
      </h3>
      <div className="flex justify-center mb-4">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-40 h-52 object-contain rounded-xl"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <p className="text-s-text-secondary text-sm text-center mb-4">
        持有 <span className="text-s-primary font-semibold">{quantity}</span> 件
      </p>
      <div className="mb-4 min-w-0">
        <p className="text-s-text text-sm leading-relaxed break-words">
          <TextWithPinyin text={item.description} showPinyin={!!showPinyin} />
        </p>
      </div>
    </StudentSideDrawer>
  );
}
