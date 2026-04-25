"use client";

import { useState } from "react";
import { useTrayStore } from "@/stores/trayStore";

const TYPE_LABEL: Record<string, string> = {
  vocab: "vocab",
  grammar: "grammar",
  particle: "particle",
  expression: "phrase",
};

const TYPE_COLOR: Record<string, string> = {
  vocab: "bg-emerald-100 text-emerald-700",
  grammar: "bg-purple-100 text-purple-700",
  particle: "bg-orange-100 text-orange-700",
  expression: "bg-sky-100 text-sky-700",
};

interface Props {
  onScrollToTurn?: (turnIndex: number) => void;
}

export function TrayDrawer({ onScrollToTurn }: Props) {
  const items = useTrayStore((s) => s.items);
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-10">
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Session tray
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <span className="text-gray-400 text-xs">{collapsed ? "▲" : "▼"}</span>
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => item.turn_index != null && onScrollToTurn?.(item.turn_index)}
              className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-3 min-w-[120px] max-w-[180px] text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors active:scale-95"
            >
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                TYPE_COLOR[item.type] ?? "bg-gray-100 text-gray-600"
              }`}>
                {TYPE_LABEL[item.type] ?? item.type}
              </span>
              <p className="text-base font-semibold text-gray-900 mt-1.5 leading-tight">{item.jp}</p>
              {item.reading && (
                <p className="text-[11px] text-gray-400 leading-none mt-0.5">{item.reading}</p>
              )}
              <p className="text-xs text-gray-600 mt-1 leading-snug line-clamp-2">{item.en}</p>
              {item.example_sentence && (
                <p className="text-[10px] text-gray-400 mt-1.5 truncate">{item.example_sentence.jp}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
